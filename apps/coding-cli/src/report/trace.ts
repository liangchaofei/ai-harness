// 【新增文件】将 Runtime 的结构化事件写成独立诊断记录。
import { open } from 'node:fs/promises';
import type { RunEvent } from '@ai-harness/runtime';

/** 按事件逐项挑选字段，文字流和任意新增字段不会自动入盘。 */
function traceRecord(event: RunEvent) {
  const common = {
    version: 1,
    runId: event.runId,
    sequence: event.sequence,
    type: event.type,
  };

  switch (event.type) {
    case 'run_start':
      return common;
    case 'input_prepared':
      return {
        ...common,
        modelCall: event.modelCall,
        historyMessageCount: event.historyMessageCount,
        inputMessageCount: event.inputMessageCount,
      };
    case 'model_start':
    case 'model_cancelled':
      return { ...common, modelCall: event.modelCall };
    case 'model_end':
      return {
        ...common,
        modelCall: event.modelCall,
        stopReason: event.stopReason,
        toolCallCount: event.toolCallCount,
      };
    case 'model_failed':
      return { ...common, modelCall: event.modelCall, code: event.code };
    case 'tool_start':
    case 'tool_cancelled':
    case 'tool_end':
    case 'tool_failed':
      return {
        ...common,
        modelCall: event.modelCall,
        toolCallId: event.toolCallId,
        toolName: event.toolName,
        ...(event.type === 'tool_end' ? { isError: event.isError } : {}),
        ...(event.type === 'tool_failed' ? { code: event.code } : {}),
      };
    case 'run_end':
      return {
        ...common,
        status: event.status,
        modelCalls: event.modelCalls,
        toolCalls: event.toolCalls,
        failureCode: event.failureCode,
      };
    default:
      return undefined;
  }
}

/** CLI 独占新文件，RunEvent 观察器串行写入，结束后由 CLI 关闭句柄。 */
export async function openRunTrace(path: string) {
  const file = await open(path, 'wx', 0o600);
  return {
    async append(event: RunEvent) {
      const record = traceRecord(event);
      if (record) {
        await file.appendFile(JSON.stringify(record) + '\n', 'utf8');
      }
    },
    close: () => file.close(),
  };
}
