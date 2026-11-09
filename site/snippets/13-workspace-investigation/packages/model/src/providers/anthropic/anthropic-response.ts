// 随提供商归组移动，更新包内相对导入，编解码行为保留。
import type { AssistantMessage } from '../../types/messages';
import type { ToolCall } from '../../types/tools';
import { isRecord } from '../../validation';

/** completeAnthropic 传入 response.json() 的未知值；不执行或保存请求。 */
export function decodeAnthropicMessage(value: unknown): AssistantMessage {
  if (!isRecord(value) || value.role !== 'assistant' || !Array.isArray(value.content)) {
    throw new Error('Anthropic 响应缺少可识别的 assistant 内容。');
  }
  const reason = value.stop_reason;
  if (reason !== 'end_turn' && reason !== 'max_tokens' && reason !== 'tool_use') {
    throw new Error('Anthropic 返回了尚不支持的停止原因。');
  }
  const texts: string[] = [];
  const toolCalls: ToolCall[] = [];
  const ids = new Set<string>();
  for (const block of value.content) {
    if (!isRecord(block)) throw new Error('Anthropic 内容块格式错误。');
    if (block.type === 'text' && typeof block.text === 'string') {
      texts.push(block.text);
    } else if (block.type === 'tool_use' && typeof block.id === 'string' && block.id.trim() &&
               typeof block.name === 'string' && block.name.trim() && isRecord(block.input)) {
      if (ids.has(block.id)) throw new Error('同一消息中的工具请求 ID 重复。');
      ids.add(block.id);
      toolCalls.push({ id: block.id, name: block.name, arguments: JSON.stringify(block.input) });
    } else {
      // 不把无法保存、无法正确反馈的内容悄悄丢掉。
      throw new Error('Anthropic 内容块不在当前文本与工具支持范围内。');
    }
  }
  if ((reason === 'tool_use' && toolCalls.length === 0) ||
      (reason === 'end_turn' && toolCalls.length > 0)) {
    throw new Error('Anthropic 停止原因与工具请求不一致。');
  }
  return {
    role: 'assistant',
    content: texts.join('\n'),
    stopReason: reason === 'tool_use' ? 'toolUse' : reason === 'max_tokens' ? 'length' : 'stop',
    toolCalls,
  };
}
