import type { RunResult } from '@ai-harness/runtime';
import { printRun } from '../../shared/print-run';

/** 返回当前审查是否有正常回答及目标文件读取证据，不验证结论一定正确。 */
export function reportRun(result: RunResult, requiredPath: string | readonly string[]): boolean {
  printRun(result);
  if (result.status !== 'answered') return false;

  // 保留原单文件调用，新增多文件证据要求；不从模型自述推断已读取。
  const paths = typeof requiredPath === 'string' ? [requiredPath] : requiredPath;
  if (paths.length === 0) {
    console.error('任务没有配置需要读取的文件，本次审查未交付。');
    return false;
  }
  const missing = paths.filter((path) => !result.messages.some((message) => message.role === 'toolResult'
    && message.toolName === 'read_file' && !message.isError
    && message.content.startsWith(`${path}\n`)));
  if (missing.length > 0) {
    console.error('缺少目标文件的成功读取证据：', JSON.stringify(missing));
    return false;
  }
  console.log('模型文本（text）：', result.answer.content);
  return true;
}
