// 运行停止后从同会话取证，再按实际变化与验收判断交付。
import type { RunResult } from '@ai-harness/runtime';
import type { TaskConfig } from '../types/task';
import type { CliSession } from '../types/session';
import { saveAcceptedMemory } from '../context/save-memory';
import { acceptTask } from './accept';
import { printBlock } from './terminal';

/** main调用；inspect失败继续抛出，不能沿用旧报告或按模型总结接受。 */
export async function reportSession(
  task: TaskConfig,
  session: CliSession,
  result: RunResult,
): Promise<number> {
  // 从Runtime已保存的历史追踪请求与反馈，不把实时预览当完整记录。
  let responseNumber = 0;
  for (const message of result.messages) {
    if (message.role === 'assistant') {
      responseNumber += 1;
      printBlock(`模型响应 ${responseNumber}`, {
        stopReason: message.stopReason,
        content: message.content,
        toolCalls: message.toolCalls,
      });
    } else if (message.role === 'toolResult') {
      printBlock(`工具反馈 · ${message.toolName}`, {
        toolCallId: message.toolCallId,
        isError: message.isError,
        content: message.content,
      });
    }
  }

  printBlock('运行停止', {
    status: result.status,
    modelCalls: result.modelCalls,
    toolCalls: result.toolCalls,
    runId: result.runId,
    observerErrors: result.observerErrors,
  });
  if (result.status === 'failed') {
    printBlock('异常分类', { phase: result.phase, code: result.failure.code });
  }
  // 总结已包含在上面的完整模型消息中，不再单独重复打印。
  if (session.plan) {
    printBlock('任务计划（模型声明）', session.plan.read());
  }

  const review = await session.codeTask.inspect();
  for (const change of review.changes) {
    printBlock(`修改前 · ${change.path}`, change.before);
    printBlock(`当前内容 · ${change.path}`, change.after);
  }
  if (review.lastCheck) {
    printBlock('最近实际验收', review.lastCheck);
  }

  const accepted = acceptTask(result, review, task.writablePaths);
  printBlock('交付判断', {
    accepted,
    checkMatchesCurrent: review.checkMatchesCurrent,
    changedFiles: review.changes.map((change) => change.path),
  });
  console.log(
    accepted
      ? '已形成可审阅交付，尚未合入来源。'
      : '未接受：请查看停止原因、当前变化与实际验收。',
  );
  // 【新增】仅从已接受的交付提取笔记。记忆写入失败独立报告。
  if (accepted && task.memoryCapture) {
    try {
      const status = await saveAcceptedMemory(task.memoryCapture, review, task.checkScript);
      printBlock('长期记忆写入', { status });
    } catch {
      printBlock('长期记忆写入', { status: 'failed' });
    }
  }
  return result.status === 'cancelled' ? 130 : accepted ? 0 : 1;
}