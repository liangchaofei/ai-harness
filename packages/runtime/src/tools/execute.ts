// 承接原 execute-tools.ts；增加 schema 门禁和可保留的失败信息。
import type { AssistantMessage, ToolResultMessage } from '@ai-harness/model';
import type { ExecutableTool } from '../types/tools';
import type { RegisteredTool } from '../types/tool-registry';
import { ToolExecutionError } from '../errors/tool-execution-error';
import { ToolBatchError } from '../errors/tool-batch-error';
import { createToolRegistry } from './registry';
// 【新增】取消与执行异常使用不同内部出口。
import { ToolBatchCancelled } from '../errors/tool-batch-cancelled';
// 执行器只提供本项摘要，不生成运行 ID 或保存全局事件。
import type { ToolEventData } from '../types/events';

/** 保留原公开接口；直接执行一批时，也先准备并检查清单。 */
export async function executeTools(message: AssistantMessage, tools: readonly ExecutableTool[], signal?: AbortSignal): Promise<ToolResultMessage[]> {
  // 【新增】公开直接执行入口也可以传入信号。
  signal?.throwIfAborted();
  return executeToolBatch(message, createToolRegistry(tools), undefined, signal);
}

/** runAgent 使用已准备清单；顺序执行，整批完成后才继续请求模型。 */
export async function executeToolBatch(
  message: AssistantMessage, registry: ReadonlyMap<string, RegisteredTool>,
  // 只由 runAgent 传入受保护的通知函数，公开 executeTools 不传观察函数。
  notify?: (event: ToolEventData) => Promise<void>,
  // 【新增】与本次运行共用的只读信号。
  signal?: AbortSignal,
): Promise<ToolResultMessage[]> {
  const ids = message.toolCalls.map((call) => call.id);
  if (message.stopReason !== 'toolUse' || ids.length === 0 ||
      ids.some((id) => typeof id !== 'string' || !id.trim()) || new Set(ids).size !== ids.length) {
    throw new ToolBatchError({ code: 'tool_protocol', message: '工具批次缺少完整请求或唯一 ID。' }, []);
  }
  const results: ToolResultMessage[] = [];
  for (const call of message.toolCalls) {
    // 【新增】上一项结束时取消，不开始本项，保留此前结果。
    if (signal?.aborted) throw new ToolBatchCancelled([...results]);
    // 表示开始处理请求，参数仍可能被拒绝，不等于已经进入工具 I/O。
    await notify?.({ type: 'tool_start', toolCallId: call.id, toolName: call.name });
    let content: string;
    let isError = false;
    try {
      // 【新增】通知回调也可能触发取消；检查后才进入执行。
      signal?.throwIfAborted();
      const tool = registry.get(call.name);
      if (!tool) throw new ToolExecutionError('没有注册该工具，请从工具说明中选择。', 'unknown_tool');
      let value: unknown;
      try {
        value = JSON.parse(call.arguments);
      } catch {
        throw new ToolExecutionError('参数不是合法 JSON，请重新生成。', 'invalid_json');
      }
      if (!tool.validate(value)) {
        // 指出结构不符，但不把参数值、schema 或库内部错误拼入反馈。
        throw new ToolExecutionError('参数不符合工具说明，请检查字段类型、必填项与额外字段。', 'invalid_arguments');
      }
      // 【修改】把信号传给真实操作；等待退出后拒绝迟到结果。
      content = await tool.execute(value, signal);
      signal?.throwIfAborted();
      if (typeof content !== 'string') throw new Error('工具没有返回文本。');
    } catch (cause) {
      // 【新增】以本次信号判定取消，不靠异常名字猜测。
      if (signal?.aborted) {
        await notify?.({ type: 'tool_cancelled', toolCallId: call.id, toolName: call.name });
        throw new ToolBatchCancelled([...results]);
      }
      if (!(cause instanceof ToolExecutionError)) {
        // 未知异常单独通知；不伪造这项请求的 toolResult。
        await notify?.({ type: 'tool_failed', toolCallId: call.id, toolName: call.name, code: 'tool_execution' });
        throw new ToolBatchError({
          code: 'tool_execution', message: '工具执行发生未知异常，已停止剩余动作。', toolCallId: call.id,
        }, [...results], { cause });
      }
      content = JSON.stringify({ code: cause.code, message: cause.message });
      isError = true;
    }
    results.push({ role: 'toolResult', toolCallId: call.id, toolName: call.name, content, isError });
    // 结果已进入本批数组；runAgent 会在整批结束或异常返回后写入历史。
    await notify?.({ type: 'tool_end', toolCallId: call.id, toolName: call.name, isError });
  }
  // 【新增】最后一项的观察期间取消，也要保留已记录结果并停止。
  if (signal?.aborted) throw new ToolBatchCancelled([...results]);
  return results;
}