// 【新增文件】示例展示运行记录，并检查当前审查任务的读取证据。
import type { RunResult } from '@ai-harness/runtime';

/** 只展示允许的异常标识；原异常留在 result.error 中供本地断点查看。 */
function describeFailure(error: unknown): string {
  if (!(error instanceof Error)) return '未识别的异常';
  if (/^模型服务请求失败（HTTP \d{3}）。$/.test(error.message)) return error.message;
  const names = new Set(['Error', 'TypeError', 'SyntaxError', 'TimeoutError', 'AbortError']);
  const name = names.has(error.name) ? error.name : 'Error';
  const cause = error.cause;
  const code = cause instanceof Error && 'code' in cause ? cause.code : undefined;
  const codes = new Set(['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_SOCKET']);
  return typeof code === 'string' && codes.has(code) ? `${name} / ${code}` : name;
}

/** 应用使用；返回是否满足本示例基本展示条件，不验证代码结论一定正确。 */
export function reportRun(result: RunResult, requiredPath: string): boolean {
  let responseNumber = 0;
  for (const message of result.messages) {
    if (message.role === 'assistant') {
      responseNumber += 1;
      console.log(`模型响应 ${responseNumber}：`, JSON.stringify(message));
    } else if (message.role === 'toolResult') {
      console.log('本地工具结果：', JSON.stringify(message));
    }
  }
  console.log('运行停止：', result.status, '模型调用次数：', result.modelCalls);
  if (result.status === 'failed') {
    console.error('异常阶段：', result.phase, '异常标识：', describeFailure(result.error));
    return false;
  }
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
