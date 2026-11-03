// 【新增文件】将项目历史转换为服务能识别的消息。
import type { Message } from '../types/messages';

/** complete 调用它创建发送用数组；不改变应用保存的记录。 */
export function encodeMessages(messages: readonly Message[]) {
  return messages.map((message) => {
    if (message.role === 'user') {
      return { role: 'user' as const, content: message.content };
    }
    if (message.role === 'toolResult') {
      return {
        role: 'tool' as const,
        tool_call_id: message.toolCallId,
        // 服务没有本项目的 isError 字段，把状态和内容一起编码为文本。
        content: JSON.stringify({ isError: message.isError, content: message.content }),
      };
    }
    return {
      role: 'assistant' as const,
      content: message.content || null,
      tool_calls: message.toolCalls.length ? message.toolCalls.map((call) => ({
        id: call.id,
        type: 'function' as const,
        function: { name: call.name, arguments: call.arguments },
      })) : undefined,
    };
  });
}