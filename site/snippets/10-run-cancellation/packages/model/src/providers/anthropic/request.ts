// 完整与流式调用共用该服务的编码、请求头和单请求时限。
import type { Context } from '../../types/context';
import type { ResolvedCompleteOptions } from '../../types/options';
import { encodeAnthropicMessages } from './anthropic-messages';

/** 同一上下文只改变 stream 开关，不维护两份服务请求规则。 */
export function createAnthropicRequest(context: Context, options: ResolvedCompleteOptions, streaming: boolean): RequestInit {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
      'anthropic-version': '2026-10-21',
    },
    body: JSON.stringify({
      model: options.model,
      system: context.systemPrompt,
      messages: encodeAnthropicMessages(context.messages),
      tools: context.tools?.length ? context.tools.map((tool) => ({
        name: tool.name, description: tool.description, input_schema: tool.parameters,
      })) : undefined,
      stream: streaming,
      // 当前公共消息没有思考块；选用支持关闭思考的模型，例如 claude-haiku-5-5。
      thinking: { type: 'disabled' },
      max_tokens: options.maxTokens,
    }),
    // 【修改】任一信号触发即可停止当前 HTTP；保留原单次 30 秒限制。
    signal: options.signal
      ? AbortSignal.any([options.signal, AbortSignal.timeout(30_000)])
      : AbortSignal.timeout(30_000),
  };
}
