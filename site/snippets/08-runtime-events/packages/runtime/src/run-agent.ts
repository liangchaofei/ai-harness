// Runtime 持有本次历史，自动衔接模型决定与工具反馈。
import { ModelCallError, type AssistantMessage } from '@ai-harness/model';
import type { RunAgentOptions, RunOutcome, RunResult } from './types/run';
import { executeToolBatch } from './tools/execute';
import { createToolRegistry } from './tools/registry';
import { ToolBatchError } from './errors/tool-batch-error';
import type { RegisteredTool } from './types/tool-registry';
// 【新增】派发器处理事件身份与观察失败，循环保留状态写入权。
import { createRunEvents } from './events/dispatcher';

/** 应用调用一次；返回明确的停止结果，不把模型停止等同于任务验收通过。 */
export async function runAgent(options: RunAgentOptions): Promise<RunResult> {
  if (!Number.isSafeInteger(options.maxModelCalls) || options.maxModelCalls < 1) {
    throw new Error('maxModelCalls 必须为正安全整数。');
  }
  if (options.messages.length === 0) throw new Error('初始消息不能为空。');

  // 复制数组，由 Runtime 独占本次追加权；不深拷贝或冻结消息对象。
  const messages = [...options.messages];
  let modelCalls = 0;
  // 【新增】有效的运行入口有统一的开始通知与停止出口。
  const events = createRunEvents(options.onEvent);
  await events.emit({ type: 'run_start' });

  async function finish(outcome: RunOutcome): Promise<RunResult> {
    await events.emit({
      type: 'run_end', status: outcome.status, modelCalls: outcome.modelCalls,
      failureCode: outcome.status === 'failed' ? outcome.failure.code : undefined,
    });
    // 最后一条通知也可能失败，因此在通知之后读取计数。
    return { ...outcome, runId: events.runId, observerErrors: events.errorCount() };
  }

  let registry: ReadonlyMap<string, RegisteredTool>;
  try {
    registry = createToolRegistry(options.tools);
  } catch (error) {
    if (!(error instanceof ToolBatchError)) throw error;
    // 【修改】所有原有停止分支经 finish 通知，再把结果交给应用。
    return finish({ status: 'failed', phase: 'tools', failure: error.failure, error, messages, modelCalls });
  }
  const definitions = [...registry.values()].map(({ name, description, parameters }) => ({
    name, description, parameters,
  }));

  while (modelCalls < options.maxModelCalls) {
    modelCalls += 1;
    // 【新增】先让应用看到开始，再进入真正的模型等待。
    await events.emit({ type: 'model_start', modelCall: modelCalls });
    let message: AssistantMessage;
    try {
      // 每次使用最新记录；给调用方单独的数组，不暴露工具执行函数。
      message = await options.callModel({
        systemPrompt: options.systemPrompt,
        messages: [...messages],
        tools: definitions,
      });
    } catch (error) {
      const failure = error instanceof ModelCallError
        ? { code: `model_${error.kind}` as const, message: error.message, httpStatus: error.httpStatus }
        : { code: 'model_unknown' as const, message: '模型调用函数发生未分类异常。' };
      // 【新增】模型失败没有完整消息，不伪造 model_end。
      await events.emit({ type: 'model_failed', modelCall: modelCalls, code: failure.code });
      return finish({ status: 'failed', phase: 'model', failure, error, messages, modelCalls });
    }
    messages.push(message);
    // 【新增】完整模型消息已保存；这里只通知摘要，不把消息交给监听方改写。
    await events.emit({ type: 'model_end', modelCall: modelCalls,
      stopReason: message.stopReason, toolCallCount: message.toolCalls.length });

    // 截断的动作参数不能执行；空文本也不能当作有效回答。
    if (message.stopReason === 'length') {
      return finish({ status: 'truncated', messages, modelCalls });
    }
    if (message.stopReason === 'stop') {
      if (!message.content.trim()) return finish({ status: 'emptyAnswer', messages, modelCalls });
      return finish({ status: 'answered', answer: message, messages, modelCalls });
    }

    // 最后一次仍请求动作：记录请求，但不执行无法再反馈给模型的批次。
    if (modelCalls === options.maxModelCalls) {
      return finish({ status: 'callLimit', messages, modelCalls });
    }
    try {
      // 【修改】执行器通知单项事实；循环补上它属于第几次模型调用。
      const results = await executeToolBatch(message, registry, (event) =>
        events.emit({ ...event, modelCall: modelCalls }));
      messages.push(...results);
    } catch (error) {
      if (error instanceof ToolBatchError) {
        messages.push(...error.completedResults);
        return finish({ status: 'failed', phase: 'tools', failure: error.failure, error, messages, modelCalls });
      }
      return finish({ status: 'failed', phase: 'tools', error, messages, modelCalls,
        failure: { code: 'tool_execution', message: '工具调度发生未知异常。' } });
    }
    // 不需要手写第二次调用；回到循环顶部，再带着完整反馈请求模型。
  }
  throw new Error('运行计数异常。');
}
