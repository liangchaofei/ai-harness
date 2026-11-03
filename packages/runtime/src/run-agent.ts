// 【新增文件】Runtime 持有本次历史，自动衔接模型决定与工具反馈。
import type { AssistantMessage } from '@ai-harness/model';
import type { RunAgentOptions, RunResult } from './types/run';
import { executeTools } from './execute-tools';

/** 应用调用一次；返回明确的停止结果，不把模型停止等同于任务验收通过。 */
export async function runAgent(options: RunAgentOptions): Promise<RunResult> {
  if (!Number.isSafeInteger(options.maxModelCalls) || options.maxModelCalls < 1) {
    throw new Error('maxModelCalls 必须为正安全整数。');
  }
  if (options.messages.length === 0) throw new Error('初始消息不能为空。');

  // 复制数组，由 Runtime 独占本次追加权；不深拷贝或冻结消息对象。
  const messages = [...options.messages];
  const definitions = options.tools.map(({ name, description, parameters }) => ({
    name, description, parameters,
  }));
  let modelCalls = 0;

  while (modelCalls < options.maxModelCalls) {
    modelCalls += 1;
    let message: AssistantMessage;
    try {
      // 每次使用最新记录；给调用方单独的数组，不暴露工具执行函数。
      message = await options.callModel({
        systemPrompt: options.systemPrompt,
        messages: [...messages],
        tools: definitions,
      });
    } catch (error) {
      return { status: 'failed', phase: 'model', error, messages, modelCalls };
    }
    messages.push(message);

    // 截断的动作参数不能执行；空文本也不能当作有效回答。
    if (message.stopReason === 'length') {
      return { status: 'truncated', messages, modelCalls };
    }
    if (message.stopReason === 'stop') {
      if (!message.content.trim()) return { status: 'emptyAnswer', messages, modelCalls };
      return { status: 'answered', answer: message, messages, modelCalls };
    }

    // 最后一次仍请求动作：记录请求，但不执行无法再反馈给模型的批次。
    if (modelCalls === options.maxModelCalls) {
      return { status: 'callLimit', messages, modelCalls };
    }
    try {
      const results = await executeTools(message, options.tools);
      messages.push(...results);
    } catch (error) {
      return { status: 'failed', phase: 'tools', error, messages, modelCalls };
    }
    // 不需要手写第二次调用；回到循环顶部，再带着完整反馈请求模型。
  }
  throw new Error('运行计数异常。');
}