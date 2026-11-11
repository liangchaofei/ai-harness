// 循环保留历史和计数，期限与取消交给独立控制模块。
import { ModelCallError, type AssistantMessage, type Context } from '@ai-harness/model';
import type { RunAgentOptions, RunResult, RunOutcome } from './types/run';
import type { RunControl } from './types/run-control';
import type { RegisteredTool } from './types/tool-registry';
import { ToolBatchError } from './errors/tool-batch-error';
import { ToolBatchCancelled } from './errors/tool-batch-cancelled';
import { ToolBatchLimit } from './errors/tool-batch-limit';
import { createToolRegistry } from './tools/registry';
import { executeToolBatch } from './tools/execute';
import { createRunEvents } from './events/dispatcher';
import { createRunControl } from './control/run-control';
// 【新增】输入组装与完整历史分离，复制细节不堆进循环。
import { copyMessages, prepareModelInput } from './context/prepare-input';

/** 应用调用一次；合法配置后开始整次期限，所有出口都清理控制资源。 */
export async function runAgent(options: RunAgentOptions): Promise<RunResult> {
  if (!Number.isSafeInteger(options.maxModelCalls) || options.maxModelCalls < 1) {
    throw new Error('maxModelCalls 必须为正安全整数。');
  }
  if (options.messages.length === 0) {
    throw new Error('初始消息不能为空。');
  }
  // 预算配置出错时不启动模型或工具。
  if (
    options.maxToolCalls !== undefined &&
    (!Number.isSafeInteger(options.maxToolCalls) || options.maxToolCalls < 0)
  ) {
    throw new Error('maxToolCalls 必须为非负安全整数。');
  }
  // 在有效运行入口创建期限控制，结束时统一释放。
  const control = createRunControl(options.signal, options.timeoutMs);
  try {
    return await runLoop(options, control);
  } finally {
    control.dispose();
  }
}

/** 只在包内使用：持有本次消息/计数，不创建计时器或进程监听。 */
async function runLoop(
  options: RunAgentOptions,
  control: RunControl,
): Promise<RunResult> {
  // 【修改】独立持有初始消息及其工具请求对象。
  const messages = copyMessages(options.messages);
  let modelCalls = 0;
  // 计数由循环持有；执行器通过下面的回调申请一次处理额度。
  let toolCalls = 0;
  const events = createRunEvents(options.onEvent);
  await events.emit({ type: 'run_start' });

  async function finish(outcome: RunOutcome): Promise<RunResult> {
    // 停止原因选定后清理计时器，不把 run_end 展示算成任务超时。
    control.dispose();
    await events.emit({
      type: 'run_end',
      status: outcome.status,
      modelCalls: outcome.modelCalls,
      toolCalls: outcome.toolCalls,
      failureCode: outcome.status === 'failed' ? outcome.failure.code : undefined,
    });
    return {
      ...outcome,
      runId: events.runId,
      observerErrors: events.errorCount(),
    };
  }
  // 替代原 cancel：根据控制对象区分主动取消和整次到期。
  function finishStopped(): Promise<RunResult> {
    const status = control.stopStatus();
    if (!status) {
      throw new Error('尚未收到运行停止请求。');
    }
    return finish({
      status,
      messages,
      modelCalls,
      toolCalls,
    });
  }
  // 工具执行器每处理一项前调用；总计数仍只在此处更新。
  function tryStartToolCall(): boolean {
    if (options.maxToolCalls !== undefined && toolCalls >= options.maxToolCalls) {
      return false;
    }
    toolCalls += 1;
    return true;
  }
  if (control.stopStatus()) {
    return finishStopped();
  }

  let registry: ReadonlyMap<string, RegisteredTool>;
  try {
    registry = createToolRegistry(options.tools);
  } catch (error) {
    if (!(error instanceof ToolBatchError)) {
      throw error;
    }
    return finish({
      status: 'failed',
      phase: 'tools',
      failure: error.failure,
      error,
      messages,
      modelCalls,
      toolCalls,
    });
  }
  const definitions = [...registry.values()].map(
    ({ name, description, parameters }) => ({
      name,
      description,
      parameters,
    }),
  );

  while (modelCalls < options.maxModelCalls) {
    // 不只检查外部取消，还刷新整次期限。
    if (control.stopStatus()) {
      return finishStopped();
    }
    const nextCall = modelCalls + 1;
    // 【新增】本轮输入仅交给callModel，不回写messages。
    let context: Context;
    try {
      context = await prepareModelInput(messages, {
        systemPrompt: options.systemPrompt,
        tools: definitions,
        prepareMessages: options.prepareMessages,
        signal: control.signal,
      });
    } catch (error) {
      if (control.stopStatus()) {
        return finishStopped();
      }

      return finish({
        status: 'failed',
        phase: 'input',
        failure: {
          code: 'input_preparation',
          message: '本轮模型输入准备失败。',
        },
        error,
        messages,
        modelCalls,
        toolCalls,
      });
    }
    if (control.stopStatus()) {
      return finishStopped();
    }

    await events.emit({
      type: 'input_prepared',
      modelCall: nextCall,
      historyMessageCount: messages.length,
      inputMessageCount: context.messages.length,
    });
    if (control.stopStatus()) {
      return finishStopped();
    }

    await events.emit({
      type: 'model_start',
      modelCall: nextCall,
    });
    if (control.stopStatus()) {
      return finishStopped();
    }
    modelCalls = nextCall;
    let message: AssistantMessage;
    try {
      message = await options.callModel(
        // 【修改】只交出本轮输入，不替换完整记录。
        context,
        async (text) => {
          // 预览也刷新期限；只有仍在运行时才通知。
          if (!control.stopStatus()) {
            await events.emit({
              type: 'model_text_delta',
              modelCall: modelCalls,
              text,
            });
          }
        },
        control.signal,
      );
      if (control.stopStatus()) {
        await events.emit({
          type: 'model_cancelled',
          modelCall: modelCalls,
        });
        return finishStopped();
      }
    } catch (error) {
      if (control.stopStatus()) {
        await events.emit({
          type: 'model_cancelled',
          modelCall: modelCalls,
        });
        return finishStopped();
      }
      const failure =
        error instanceof ModelCallError
          ? {
              code: `model_${error.kind}` as const,
              message: error.message,
              httpStatus: error.httpStatus,
            }
          : {
              code: 'model_unknown' as const,
              message: '模型调用函数发生未分类异常。',
            };
      await events.emit({
        type: 'model_failed',
        modelCall: modelCalls,
        code: failure.code,
      });
      return finish({
        status: 'failed',
        phase: 'model',
        failure,
        error,
        messages,
        modelCalls,
        toolCalls,
      });
    }
    messages.push(message);
    await events.emit({
      type: 'model_end',
      modelCall: modelCalls,
      stopReason: message.stopReason,
      toolCallCount: message.toolCalls.length,
    });
    if (control.stopStatus()) {
      return finishStopped();
    }

    if (message.stopReason === 'length') {
      return finish({
        status: 'truncated',
        messages,
        modelCalls,
        toolCalls,
      });
    }
    if (message.stopReason === 'stop') {
      if (!message.content.trim()) {
        return finish({
          status: 'emptyAnswer',
          messages,
          modelCalls,
          toolCalls,
        });
      }
      return finish({
        status: 'answered',
        answer: message,
        messages,
        modelCalls,
        toolCalls,
      });
    }
    // 保留旧规则：没有机会把结果交回模型的最后一批不执行。
    if (modelCalls === options.maxModelCalls) {
      return finish({
        status: 'callLimit',
        messages,
        modelCalls,
        toolCalls,
      });
    }
    try {
      // 具名传入通知、运行信号、时间刷新和预算申请；执行器不持有全局计数。
      const results = await executeToolBatch(message, registry, {
        signal: control.signal,
        notify: (event) =>
          events.emit({
            ...event,
            modelCall: modelCalls,
          }),
        checkStop: () => {
          control.stopStatus();
        },
        tryStartToolCall,
      });
      messages.push(...results);
    } catch (error) {
      if (error instanceof ToolBatchCancelled) {
        messages.push(...error.completedResults);
        return finishStopped();
      }
      // 工具额度不足保留此前项，不再请求模型或执行超额项。
      if (error instanceof ToolBatchLimit) {
        messages.push(...error.completedResults);
        return finish({
          status: 'toolLimit',
          messages,
          modelCalls,
          toolCalls,
        });
      }
      if (error instanceof ToolBatchError) {
        messages.push(...error.completedResults);
        return finish({
          status: 'failed',
          phase: 'tools',
          failure: error.failure,
          error,
          messages,
          modelCalls,
          toolCalls,
        });
      }
      return finish({
        status: 'failed',
        phase: 'tools',
        error,
        messages,
        modelCalls,
        toolCalls,
        failure: {
          code: 'tool_execution',
          message: '工具调度发生未知异常。',
        },
      });
    }
  }
  throw new Error('运行计数异常。');
}
