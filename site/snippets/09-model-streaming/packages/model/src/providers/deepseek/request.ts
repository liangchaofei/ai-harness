// 【新增文件】完整与流式调用共用该服务的编码、请求头和单请求时限。
import type { Context } from '../../types/context';
import type { ResolvedCompleteOptions } from '../../types/options';
import { encodeMessages } from './deepseek-messages';

/** 同一上下文只改变 stream 开关，不维护两份服务请求规则。 */
export function createDeepSeekRequest(context: Context, options: ResolvedCompleteOptions, streaming: boolean): RequestInit {
  const history = encodeMessages(context.messages);
  const messages = context.systemPrompt === undefined
    ? history
    : [{ role: 'system', content: context.systemPrompt }, ...history];
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      messages,
      // 把应用工具说明转换为服务协议；未提供时不发送tools字段。
      tools: context.tools?.length ? context.tools.map((tool) => ({
        type: 'function',
        function: { name: tool.name, description: tool.description, parameters: tool.parameters },
      })) : undefined,
      stream: streaming,
      thinking: { type: 'disabled' },
      max_tokens: options.maxTokens,
    }),
    // 只限制本次HTTP等待；整次Agent的预算由后续Runtime负责。
    signal: AbortSignal.timeout(30_000),
  };
}
