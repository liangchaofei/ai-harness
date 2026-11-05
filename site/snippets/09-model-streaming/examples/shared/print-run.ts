import type { RunResult } from '@ai-harness/runtime';
// 应用共用终端排版，保留原有异常信息筛选。
import { logBlock } from './terminal';

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

/** 应用在运行停止后展示记录和受控诊断，不执行模型或工具。 */
export function printRun(result: RunResult): void {
  // 记录分块展示，源码和回答保留实际换行，不再挤成一行 JSON。
  logBlock('运行记录');
  let responseNumber = 0;
  for (const message of result.messages) {
    if (message.role === 'assistant') {
      responseNumber += 1;
      logBlock(`模型响应 ${responseNumber} · ${message.stopReason}`, message.content || '（无文本）');
      if (message.toolCalls.length > 0) logBlock('模型提出的工具请求', message.toolCalls);
    } else if (message.role === 'toolResult') {
      logBlock(`工具结果 · ${message.toolName} / ${message.toolCallId} · ${message.isError ? '失败反馈' : '成功'}`,
        message.content);
    }
  }
  // 只选择需要展示的字段，不把含原始 error 的整个结果交给打印工具。
  logBlock('运行停止', {
    status: result.status,
    modelCalls: result.modelCalls,
    runId: result.runId,
    observerErrors: result.observerErrors,
  });
  if (result.status === 'failed') {
    logBlock('运行失败', {
      code: result.failure.code,
      message: result.failure.message,
      phase: result.phase,
      diagnostic: describeFailure(result.error),
    });
  }
}
