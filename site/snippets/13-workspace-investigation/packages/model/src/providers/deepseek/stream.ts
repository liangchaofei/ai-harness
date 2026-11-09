// 拼接 DeepSeek 的文本和按 index 分开的工具参数，结束后才交付消息。
import type { Context } from '../../types/context';
import type { ResolvedCompleteOptions } from '../../types/options';
import type { ModelStreamEvent } from '../../types/stream';
import { isRecord } from '../../validation';
import { ModelCallError } from '../../errors/model-call-error';
import { decodeMessage } from './deepseek-response';
import { createDeepSeekRequest } from './request';
import { requestResponse } from '../shared/request-response';
import { readSse } from '../shared/read-sse';

/** stream 委派到此；局部草稿不交给 Runtime 执行。 */
export async function* streamDeepSeek(context: Context, options: ResolvedCompleteOptions): AsyncGenerator<ModelStreamEvent> {
  const response = await requestResponse('https://api.deepseek.com/chat/completions',
    createDeepSeekRequest(context, options, true), options.fetch ?? globalThis.fetch);
  let content = '';
  let reason: string | undefined;
  const calls = new Map<number, { id: string; name: string; arguments: string }>();
  for await (const frame of readSse(response)) {
    if (frame.data === '[DONE]') {
      if (!reason) throw new Error('DeepSeek 流缺少停止原因。');
      // 各项可以交错到达；完整结果按协议 index 排序，缺失项不能猜补。
      const ordered = [...calls.entries()].sort(([left], [right]) => left - right);
      if (reason !== 'length' && ordered.some(([index], position) => index !== position)) {
        throw new Error('完整工具列表存在缺失索引。');
      }
      // 截断时只交回文本与 length，不把可能残缺的动作草稿作为请求交付。
      const message = reason === 'length'
        ? { role: 'assistant' as const, content, stopReason: 'length' as const, toolCalls: [] }
        : decodeMessage({ choices: [{ finish_reason: reason, message: {
            role: 'assistant', content,
            tool_calls: ordered.map(([, call]) => ({ id: call.id, type: 'function',
              function: { name: call.name, arguments: call.arguments } })),
          } }] });
      yield { type: 'done', message };
      return;
    }
    const value: unknown = JSON.parse(frame.data);
    if (isRecord(value) && isRecord(value.error)) throw new ModelCallError('service', '模型服务在流中报告失败。');
    if (!isRecord(value) || !Array.isArray(value.choices) || value.choices.length !== 1) {
      throw new Error('DeepSeek 流缺少单项 choice。');
    }
    const choice: unknown = value.choices[0];
    if (!isRecord(choice) || choice.index !== 0 || !isRecord(choice.delta) || reason) {
      throw new Error('DeepSeek 流的顺序或 choice 不受支持。');
    }
    const delta = choice.delta;
    if ((delta.role !== undefined && delta.role !== 'assistant') ||
        (delta.reasoning_content !== undefined && delta.reasoning_content !== null && delta.reasoning_content !== '')) {
      throw new Error('DeepSeek 流出现不支持的角色或思考内容。');
    }
    if (delta.content !== undefined && delta.content !== null) {
      if (typeof delta.content !== 'string') throw new Error('文字增量不是文本。');
      content += delta.content;
      if (delta.content) yield { type: 'text_delta', text: delta.content };
    }
    if (delta.tool_calls !== undefined) {
      if (!Array.isArray(delta.tool_calls)) throw new Error('工具增量不是数组。');
      for (const item of delta.tool_calls) {
        if (!isRecord(item) || !Number.isSafeInteger(item.index) || (item.index as number) < 0 ||
            (item.type !== undefined && item.type !== 'function') ||
            (item.function !== undefined && !isRecord(item.function))) {
          throw new Error('工具增量缺少可识别的索引或 function。');
        }
        const fn = isRecord(item.function) ? item.function : {};
        const index = item.index as number;
        let call = calls.get(index);
        if (!call) {
          call = { id: '', name: '', arguments: '' };
          calls.set(index, call);
        }
        for (const key of ['id', 'name', 'arguments'] as const) {
          const piece = key === 'id' ? item.id : fn[key];
          if (piece !== undefined && typeof piece !== 'string') throw new Error('工具增量字段不是文本。');
          call[key] += piece ?? '';
        }
      }
    }
    if (choice.finish_reason !== undefined && choice.finish_reason !== null) {
      if (!['stop', 'length', 'tool_calls'].includes(String(choice.finish_reason))) throw new Error('不支持的停止原因。');
      reason = choice.finish_reason as string;
    }
  }
  throw new Error('DeepSeek 流在 [DONE] 前结束。');
}
