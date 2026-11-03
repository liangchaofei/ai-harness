// 继续负责请求，将响应转换交给同目录的解码模块。
import type { AssistantMessage } from '../types/messages';
import type { Context } from '../types/context';
import type { CompleteOptions } from '../types/options';
import { decodeMessage } from './deepseek-response';
// 【新增】请求也要转换历史中的动作与结果。
import { encodeMessages } from './deepseek-messages';

/** 只取得一次模型结果，不把停止生成等同于任务完成。 */
export async function complete(context: Context, options: CompleteOptions): Promise<AssistantMessage> {
  if (!options.apiKey.trim()) throw new Error('缺少DEEPSEEK_API_KEY。');
  if (!options.model.trim() || context.messages.length === 0) {
    throw new Error('模型名称与消息不能为空。');
  }
  const maxTokens = options.maxTokens ?? 256;
  if (!Number.isSafeInteger(maxTokens) || maxTokens < 1) throw new Error('maxTokens需为正安全整数。');

  // 把项目Context转换成DeepSeek的messages，不修改调用方持有的原数组。
  // 【修改】先转换历史，再附加总体要求；不直接展开项目内部消息。
  const history = encodeMessages(context.messages);
  const messages = context.systemPrompt === undefined
    ? history
    : [{ role: 'system', content: context.systemPrompt }, ...history];
  const response = await fetch('https://api.deepseek.com/chat/completions', {
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
      max_tokens: maxTokens,
    }),
    // 只限制本次HTTP等待；整次Agent的预算由后续Runtime负责。
    signal: AbortSignal.timeout(30_000),
  });

  // 不把服务错误正文或带凭据的请求对象直接打印到终端。
  if (!response.ok) throw new Error(`模型服务请求失败（HTTP ${response.status}）。`);
  const value: unknown = await response.json();
  return decodeMessage(value);
}