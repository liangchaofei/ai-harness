// 【新增文件】把项目历史转换为 Anthropic 的消息块。
import type { Message } from '../../types/messages';
import type { AnthropicMessage, AnthropicTextBlock, AnthropicToolUseBlock } from '../../types/anthropic';
import { isRecord } from '../../validation';

/** completeAnthropic 调用；创建发送用数组，原记录仍由 Runtime 保存。 */
export function encodeAnthropicMessages(messages: readonly Message[]): AnthropicMessage[] {
  const encoded: AnthropicMessage[] = [];
  let previousRole: Message['role'] | undefined;
  for (const message of messages) {
    const followsResult = previousRole === 'toolResult';
    previousRole = message.role;
    if (message.role === 'user') {
      encoded.push({ role: 'user', content: [{ type: 'text', text: message.content }] });
      continue;
    }
    if (message.role === 'toolResult') {
      const block = {
        type: 'tool_result' as const,
        tool_use_id: message.toolCallId,
        content: message.content,
        is_error: message.isError,
      };
      const previous = encoded.at(-1);

      // 同一批连续结果合并到一个 user 消息，紧接原 assistant 请求。
      if (previous?.role === 'user' && followsResult) {
        previous.content.push(block);
      } else {
        encoded.push({ role: 'user', content: [block] });
      }
      continue;
    }
    const content: (AnthropicTextBlock | AnthropicToolUseBlock)[] = [];
    if (message.content) content.push({ type: 'text', text: message.content });
    for (const call of message.toolCalls) {
      const input: unknown = JSON.parse(call.arguments);
      if (!isRecord(input)) throw new Error('Anthropic 历史工具参数必须是 JSON 对象。');
      content.push({ type: 'tool_use', id: call.id, name: call.name, input });
    }
    encoded.push({ role: 'assistant', content });
  }
  return encoded;
}