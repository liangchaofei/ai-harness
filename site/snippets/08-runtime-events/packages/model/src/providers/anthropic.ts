// HTTP 失败统一归类，服务消息编解码仍分别保留。
import { requestJson } from './shared/request-json';
import type { Context } from '../types/context';
import type { AssistantMessage } from '../types/messages';
import type { ResolvedCompleteOptions } from '../types/options';
import { encodeAnthropicMessages } from './anthropic-messages';
import { decodeAnthropicMessage } from './anthropic-response';

/** 公开 complete 分发到这里；只取得一次服务响应，循环仍由 Runtime 驱动。 */
export async function completeAnthropic(
  context: Context, options: ResolvedCompleteOptions,
): Promise<AssistantMessage> {
  const value = await requestJson('https://api.anthropic.com/v1/messages', {
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
      stream: false,
      // 当前公共消息没有思考块；选用支持关闭思考的模型，例如 claude-haiku-5-5。
      thinking: { type: 'disabled' },
      max_tokens: options.maxTokens,
    }),
    signal: AbortSignal.timeout(30_000),
  }, options.fetch ?? globalThis.fetch);

  return decodeAnthropicMessage(value);
}
