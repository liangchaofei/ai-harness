// 【修改】保留完整调用入口，请求构造与流式适配共用。
import type { Context } from '../../types/context';
import type { AssistantMessage } from '../../types/messages';
import type { ResolvedCompleteOptions } from '../../types/options';
import { requestJson } from '../shared/request-json';
import { createAnthropicRequest } from './request';
import { decodeAnthropicMessage } from './anthropic-response';

/** complete 的原非流式路径保留；不保存历史或执行工具。 */
export async function completeAnthropic(context: Context, options: ResolvedCompleteOptions): Promise<AssistantMessage> {
  const value = await requestJson('https://api.anthropic.com/v1/messages',
    createAnthropicRequest(context, options, false), options.fetch ?? globalThis.fetch);
  return decodeAnthropicMessage(value);
}
