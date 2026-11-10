import type { Message } from '@ai-harness/model';
import type { RunResult } from '@ai-harness/runtime';
import { printRun } from '../../shared/print-run';
import { isRecord } from './validation';

/** 在实际成功结果中查找指定查询，不把模型自述或失败结果当作证据。 */
function hasQuery(messages: readonly Message[], toolName: string, id: string): boolean {
  return messages.some((message) => {
    if (message.role !== 'toolResult' || message.toolName !== toolName || message.isError) return false;
    try {
      const value: unknown = JSON.parse(message.content);
      return isRecord(value) && value.id === id
        && typeof value.record === 'string' && value.record.trim().length > 0;
    } catch {
      return false;
    }
  });
}

/** 应用提供当前受控任务的预期证据；不规定模型动作顺序，也不验证文字结论一定正确。 */
export function reportRun(result: RunResult, releaseId: string, serviceIds: readonly string[]): boolean {
  printRun(result);
  if (result.status !== 'answered') return false;

  const required = [
    { toolName: 'lookup_release', id: releaseId },
    ...serviceIds.map((id) => ({ toolName: 'lookup_service', id })),
  ];
  const missing = required.filter(({ toolName, id }) => !hasQuery(result.messages, toolName, id));
  if (missing.length > 0) {
    console.error('缺少成功查询证据：', JSON.stringify(missing));
    return false;
  }
  console.log('调查摘要：', result.answer.content);
  return true;
}
