// 【修改】循环读取取消信号；等待退出、保存已有事实，再统一停止。
import { ModelCallError, type AssistantMessage } from '@ai-harness/model';
import type { RunAgentOptions, RunResult, RunOutcome } from './types/run';
import type { RegisteredTool } from './types/tool-registry';
import { ToolBatchError } from './errors/tool-batch-error';
import { ToolBatchCancelled } from './errors/tool-batch-cancelled';
import { createToolRegistry } from './tools/registry';
import { executeToolBatch } from './tools/execute';
import { createRunEvents } from './events/dispatcher';

/** 应用调用一次；Runtime 独占追加历史的责任，取消不作为模型答案。 */
export async function runAgent(options: RunAgentOptions): Promise<RunResult> {
  if (!Number.isSafeInteger(options.maxModelCalls) || options.maxModelCalls < 1) {
    throw new Error('maxModelCalls 必须为正安全整数。');
  }
  if (options.messages.length === 0) throw new Error('初始消息不能为空。');

  const messages = [...options.messages];
  let modelCalls = 0;
  const events = createRunEvents(options.onEvent);
  await events.emit({ type: 'run_start' });

  async function finish(outcome: RunOutcome): Promise<RunResult> {
    // 停止原因在发送终止通知前确定；run_end 的监听不会重新打开已停止运行。
    await events.emit({
      type: 'run_end', status: outcome.status, modelCalls: outcome.modelCalls,
      failureCode: outcome.status === 'failed' ? outcome.failure.code : undefined,
    });
    return { ...outcome, runId: events.runId, observerErrors: events.errorCount() };
  }

  // 【新增】每个取消出口都返回已有完整记录，不打印 signal.reason。
  const cancel = () => finish({ status: 'cancelled', messages, modelCalls });
  if (options.signal?.aborted) return cancel();

  let registry: ReadonlyMap<string, RegisteredTool>;
  try {
    registry = createToolRegistry(options.tools);
  } catch (error) {
    if (!(error instanceof ToolBatchError)) throw error;
    return finish({ status: 'failed', phase: 'tools', failure: error.failure, error, messages, modelCalls });
  }
  const definitions = [...registry.values()].map(({ name, description, parameters }) => ({
    name, description, parameters,
  }));

  while (modelCalls < options.maxModelCalls) {
    // 【修改】观察完成后再检查信号；没有真正调用模型就不计次数。
    if (options.signal?.aborted) return cancel();
    const nextCall = modelCalls + 1;
    await events.emit({ type: 'model_start', modelCall: nextCall });
    if (options.signal?.aborted) return cancel();
    modelCalls = nextCall;
    let message: AssistantMessage;
    try {
      message = await options.callModel({
        systemPrompt: options.systemPrompt,
        messages: [...messages],
        tools: definitions,
      }, async (text) => {
        // 【修改】取消后不再显示本次迟到预览，历史始终只接收完整消息。
        if (!options.signal?.aborted) {
          await events.emit({ type: 'model_text_delta', modelCall: modelCalls, text });
        }
      }, options.signal);
      // 【新增】不协作的模型函数可能正常返回，仍不得保存或执行。
      if (options.signal?.aborted) {
        await events.emit({ type: 'model_cancelled', modelCall: modelCalls });
        return cancel();
      }
    } catch (error) {
      if (options.signal?.aborted) {
        await events.emit({ type: 'model_cancelled', modelCall: modelCalls });
        return cancel();
      }
      const failure = error instanceof ModelCallError
        ? { code: `model_${error.kind}` as const, message: error.message, httpStatus: error.httpStatus }
        : { code: 'model_unknown' as const, message: '模型调用函数发生未分类异常。' };
      await events.emit({ type: 'model_failed', modelCall: modelCalls, code: failure.code });
      return finish({ status: 'failed', phase: 'model', failure, error, messages, modelCalls });
    }
    messages.push(message);
    await events.emit({ type: 'model_end', modelCall: modelCalls,
      stopReason: message.stopReason, toolCallCount: message.toolCalls.length });
    // 【新增】完整消息已保存，但通知期间取消时不开始其中的动作。
    if (options.signal?.aborted) return cancel();

    if (message.stopReason === 'length') return finish({ status: 'truncated', messages, modelCalls });
    if (message.stopReason === 'stop') {
      if (!message.content.trim()) return finish({ status: 'emptyAnswer', messages, modelCalls });
      return finish({ status: 'answered', answer: message, messages, modelCalls });
    }
    if (modelCalls === options.maxModelCalls) return finish({ status: 'callLimit', messages, modelCalls });
    try {
      // 【修改】本批与模型等待读取同一个运行信号。
      const results = await executeToolBatch(message, registry, (event) =>
        events.emit({ ...event, modelCall: modelCalls }), options.signal);
      messages.push(...results);
    } catch (error) {
      // 【新增】批次带回已经完成的项；取消项和未执行项不伪造反馈。
      if (error instanceof ToolBatchCancelled) {
        messages.push(...error.completedResults);
        return cancel();
      }
      if (error instanceof ToolBatchError) {
        messages.push(...error.completedResults);
        return finish({ status: 'failed', phase: 'tools', failure: error.failure, error, messages, modelCalls });
      }
      return finish({ status: 'failed', phase: 'tools', error, messages, modelCalls,
        failure: { code: 'tool_execution', message: '工具调度发生未知异常。' } });
    }
  }
  throw new Error('运行计数异常。');
}
