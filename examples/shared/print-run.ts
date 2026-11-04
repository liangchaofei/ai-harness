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

/** 应用在运行停止后调用；只打印已有记录和受控诊断，不执行模型或工具。 */
export function printRun(result: RunResult): void {
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
    // 【新增】展示框架生成的稳定代码和说明，不打印 result.error 或 cause。
    console.error('失败代码：', result.failure.code, '失败说明：', result.failure.message);
    console.error('异常阶段：', result.phase, '异常标识：', describeFailure(result.error));
  }
}