// 从DeepSeek响应中取得文本和工具请求，不执行任何工具。
import type { AssistantMessage } from '../types/messages';
import type { ToolCall } from '../types/tools';
import { isRecord } from '../validation';

/** 保留每项请求的身份与原始参数，只检查本篇支持的协议形状。 */
function decodeToolCalls(value: unknown): ToolCall[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error('tool_calls必须是数组。');

  const ids = new Set<string>();
  return value.map((item): ToolCall => {
    if (!isRecord(item) || item.type !== 'function' ||
        typeof item.id !== 'string' || !item.id.trim() || !isRecord(item.function)) {
      throw new Error('工具请求缺少可识别的类型、ID或function对象。');
    }
    const fn = item.function;
    if (typeof fn.name !== 'string' || !fn.name.trim() || typeof fn.arguments !== 'string') {
      throw new Error('工具请求缺少名称或参数文本。');
    }
    if (ids.has(item.id)) throw new Error('同一消息中的工具请求ID重复。');
    ids.add(item.id);

    // 此处保留参数文本，解析、工具查找与执行前校验留给执行层。
    return { id: item.id, name: fn.name, arguments: fn.arguments };
  });
}

/** complete调用它转换响应，返回的请求仍是待处理动作。 */
export function decodeMessage(value: unknown): AssistantMessage {
  if (!isRecord(value) || !Array.isArray(value.choices)) {
    throw new Error('模型响应缺少choices数组。');
  }
  const choice: unknown = value.choices[0];
  if (!isRecord(choice)) throw new Error('模型响应缺少可识别的choice。');
  const reason = choice.finish_reason;
  if (reason !== 'stop' && reason !== 'length' && reason !== 'tool_calls') {
    throw new Error('模型返回了本篇尚不支持的停止原因。');
  }
  const message = choice.message;
  if (!isRecord(message) || message.role !== 'assistant' ||
      (typeof message.content !== 'string' && message.content !== null)) {
    throw new Error('模型没有返回可识别的assistant消息。');
  }

  const toolCalls = decodeToolCalls(message.tool_calls);
  if (reason === 'tool_calls' && toolCalls.length === 0) {
    throw new Error('模型声明请求工具，却没有返回工具请求。');
  }
  if (reason === 'stop' && toolCalls.length > 0) {
    throw new Error('模型停止原因与工具请求不一致。');
  }

  // null表示没有附带文字；截断结果仍保留length，不升级为可用请求。
  return {
    role: 'assistant',
    content: message.content ?? '',
    stopReason: reason === 'tool_calls' ? 'toolUse' : reason,
    toolCalls,
  };
}
