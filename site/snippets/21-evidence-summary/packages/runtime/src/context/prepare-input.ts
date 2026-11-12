// 【新增文件】从完整记录构造独立的本轮模型输入。
import type { Context, Message } from '@ai-harness/model';
import type { InputPreparationOptions } from '../types/input';

/**
 * Runtime内部复制当前文本消息结构：数组、消息对象及assistant工具请求对象。
 * 字符串是值；若以后加入图片或其他嵌套对象，需要重新检查复制范围。
 */
export function copyMessages(messages: readonly Message[]): Message[] {
  return messages.map((message) => {
    if (message.role === 'assistant') {
      return {
        ...message,
        toolCalls: message.toolCalls.map((call) => ({ ...call })),
      };
    }

    return { ...message };
  });
}

/**
 * 循环在调用模型前等待；history只提供事实来源，不被本函数改写。
 * 输入、回调返回值与模型接收的消息分别复制，避免共享对象污染历史。
 */
export async function prepareModelInput(
  history: readonly Message[],
  options: InputPreparationOptions,
): Promise<Context> {
  options.signal.throwIfAborted();

  const snapshot = copyMessages(history);
  const selected = options.prepareMessages
    ? await options.prepareMessages(snapshot, options.signal)
    : snapshot;

  // 协作操作即使返回迟到结果，也不能继续启动模型。
  options.signal.throwIfAborted();
  if (!Array.isArray(selected) || selected.length === 0) {
    throw new Error('本轮输入必须返回非空消息数组。');
  }

  return {
    systemPrompt: options.systemPrompt,
    messages: copyMessages(selected),
    tools: options.tools,
  };
}
