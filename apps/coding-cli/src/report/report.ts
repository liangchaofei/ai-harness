// 【新增文件】停止后读取同会话证据、展示并返回进程应采用的结果。
import type { RunResult } from '@ai-harness/runtime';
import type { TaskConfig } from '../types/task';
import type { CliSession } from '../types/session';
import { acceptTask } from './accept';
import { printBlock } from './terminal';

/** main调用；inspect失败继续抛出，不能沿用旧报告或按模型总结接受。 */
export async function reportSession(
  task: TaskConfig,
  session: CliSession,
  result: RunResult,
): Promise<number> {
  printBlock('运行停止', {
    status: result.status,
    modelCalls: result.modelCalls,
    toolCalls: result.toolCalls,
    runId: result.runId,
    observerErrors: result.observerErrors,
  });
  if (result.status === 'failed') {
    printBlock('异常分类', {
      phase: result.phase,
      code: result.failure.code,
    });
  }
  if (result.status === 'answered') {
    printBlock('模型总结', result.answer.content);
  }
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
  return result.status === 'cancelled' ? 130 : accepted ? 0 : 1;
}