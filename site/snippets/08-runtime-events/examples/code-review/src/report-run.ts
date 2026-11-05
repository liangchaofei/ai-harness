import type { RunResult } from '@ai-harness/runtime';
import { printRun } from '../../shared/print-run';

/** 返回当前审查是否有正常回答及目标文件读取证据，不验证结论一定正确。 */
export function reportRun(result: RunResult, requiredPath: string): boolean {
    printRun(result);
  if (result.status !== 'answered') return false;

  const hasSource = result.messages.some((message) => message.role === 'toolResult'
    && message.toolName === 'read_file' && !message.isError
    && message.content.startsWith(`${requiredPath}\n`));
  if (!hasSource) {
    console.error('缺少目标文件的成功读取证据，本次审查未交付。');
    return false;
  }
  console.log('模型文本（text）：', result.answer.content);
  return true;
}
