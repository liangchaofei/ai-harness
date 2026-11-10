// 按 Anthropic 内容块生命周期拼接，message_stop 后才交付消息。
import type { Context } from '../../types/context';
import type { ResolvedCompleteOptions } from '../../types/options';
import type { ModelStreamEvent } from '../../types/stream';
import type { AnthropicBlock } from '../../types/anthropic-stream';
import { isRecord } from '../../validation';
import { ModelCallError } from '../../errors/model-call-error';
import { decodeAnthropicMessage } from './anthropic-response';
import { createAnthropicRequest } from './request';
import { requestResponse } from '../shared/request-response';
import { readSse } from '../shared/read-sse';

/** 两种原生流共用项目事件；这里不要求应用认识内容块协议。 */
export async function* streamAnthropic(context: Context, options: ResolvedCompleteOptions): AsyncGenerator<ModelStreamEvent> {
  const response = await requestResponse('https://api.anthropic.com/v1/messages',
    createAnthropicRequest(context, options, true), options.fetch ?? globalThis.fetch);
  const blocks: AnthropicBlock[] = [];
  let started = false;
  let active: number | undefined;
  let reason: string | undefined;
  for await (const frame of readSse(response)) {
    const value: unknown = JSON.parse(frame.data);
    if (!isRecord(value) || typeof value.type !== 'string' || (frame.event && frame.event !== value.type)) {
      throw new Error('Anthropic 流事件名与数据不一致。');
    }
    if (value.type === 'error' && isRecord(value.error)) throw new ModelCallError('service', '模型服务在流中报告失败。');
    if (value.type === 'ping') continue;
    if (value.type === 'message_start') {
      if (started || !isRecord(value.message) || value.message.role !== 'assistant' ||
          !Array.isArray(value.message.content) || value.message.content.length !== 0) throw new Error('无效 message_start。');
      started = true;
      continue;
    }
    if (!started) throw new Error('Anthropic 流缺少 message_start。');
    if (value.type === 'message_stop') {
      if (!reason || active !== undefined) throw new Error('Anthropic 消息或内容块尚未完成。');
      const content = blocks.filter((block) => block.type === 'text').map((block) => block.text).join('\n');
      const message = reason === 'max_tokens'
        ? { role: 'assistant' as const, content, stopReason: 'length' as const, toolCalls: [] }
        : decodeAnthropicMessage({ role: 'assistant', stop_reason: reason, content: blocks.map((block) =>
            block.type === 'text' ? block : { type: block.type, id: block.id, name: block.name,
              input: JSON.parse(block.json || '{}') }) });
      yield { type: 'done', message };
      return;
    }
    if (reason) throw new Error('停止原因之后出现额外内容。');
    if (value.type === 'content_block_start') {
      if (active !== undefined || value.index !== blocks.length || !isRecord(value.content_block)) {
        throw new Error('内容块开始顺序错误。');
      }
      const block = value.content_block;
      if (block.type === 'text' && typeof block.text === 'string') {
        const separator = blocks.some((part) => part.type === 'text') ? '\n' : '';
        blocks.push({ type: 'text', text: block.text });
        if (separator + block.text) yield { type: 'text_delta', text: separator + block.text };
      } else if (block.type === 'tool_use' && typeof block.id === 'string' && block.id.trim() &&
                 typeof block.name === 'string' && block.name.trim() && isRecord(block.input) && Object.keys(block.input).length === 0) {
        blocks.push({ type: 'tool_use', id: block.id, name: block.name, json: '' });
      } else throw new Error('内容块超出当前文本与自定义工具范围。');
      active = blocks.length - 1;
    } else if (value.type === 'content_block_delta') {
      if (active === undefined || value.index !== active || !isRecord(value.delta)) throw new Error('内容增量没有活动块。');
      const block = blocks[active]!;
      const delta = value.delta;
      if (block.type === 'text' && delta.type === 'text_delta' && typeof delta.text === 'string') {
        block.text += delta.text;
        if (delta.text) yield { type: 'text_delta', text: delta.text };
      } else if (block.type === 'tool_use' && delta.type === 'input_json_delta' && typeof delta.partial_json === 'string') {
        block.json += delta.partial_json;
      } else throw new Error('内容增量与块类型不一致。');
    } else if (value.type === 'content_block_stop') {
      if (active === undefined || value.index !== active) throw new Error('没有可结束的活动块。');
      active = undefined;
    } else if (value.type === 'message_delta') {
      if (active !== undefined || !isRecord(value.delta) ||
          !['end_turn', 'tool_use', 'max_tokens'].includes(String(value.delta.stop_reason))) throw new Error('无效消息停止原因。');
      reason = value.delta.stop_reason as string;
    } else throw new Error('不支持的 Anthropic 流事件。');
  }
  throw new Error('Anthropic 流在 message_stop 前结束。');
}
