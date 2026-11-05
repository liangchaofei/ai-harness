// HTTP 失败统一归类，服务消息编解码仍分别保留。
import { requestJson } from './shared/request-json';
// 继续负责请求，将响应转换交给同目录的解码模块。
import type { AssistantMessage } from '../types/messages';
import type { Context } from '../types/context';
import type { ResolvedCompleteOptions } from '../types/options';
import { decodeMessage } from './deepseek-response';
// 请求也要转换历史中的动作与结果。
import { encodeMessages } from './deepseek-messages';

/** 只取得一次模型结果，不把停止生成等同于任务完成。 */
export async function completeDeepSeek(context: Context, options: ResolvedCompleteOptions): Promise<AssistantMessage> {
  // 把项目Context转换成DeepSeek的messages，不修改调用方持有的原数组。
  // 先转换历史，再附加总体要求；不直接展开项目内部消息。
  const history = encodeMessages(context.messages);
  const messages = context.systemPrompt === undefined
    ? history
    : [{ role: 'system', content: context.systemPrompt }, ...history];
  const value = await requestJson('https://api.deepseek.com/chat/completions', {
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
      stream: false,
      thinking: { type: 'disabled' },
      max_tokens: options.maxTokens,
    }),
    // 只限制本次HTTP等待；整次Agent的预算由后续Runtime负责。
    signal: AbortSignal.timeout(30_000),
  }, options.fetch ?? globalThis.fetch);

  return decodeMessage(value);
}
