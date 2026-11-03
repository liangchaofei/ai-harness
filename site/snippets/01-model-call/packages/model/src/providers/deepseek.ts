// #region full
// #region imports
// 【新增文件】当前唯一提供商的文本接入；API字段留在适配内部。
import type { AssistantMessage } from '../types/messages';
import type { Context } from '../types/context';
import type { CompleteOptions } from '../types/options';
import { isRecord } from '../validation';
// #endregion imports

// #region decode
/** 保留可识别的停止原因；是否接受截断文本由调用方判断。 */
function decodeMessage(value: unknown): AssistantMessage {
  if (!isRecord(value) || !Array.isArray(value.choices)) {
    throw new Error('模型响应缺少choices数组。');
  }
  const choice: unknown = value.choices[0];
  if (!isRecord(choice) || (choice.finish_reason !== 'stop' && choice.finish_reason !== 'length')) {
    throw new Error('模型返回了本篇尚不支持的停止原因。');
  }
  const message = choice.message;
  if (!isRecord(message) || message.role !== 'assistant' || typeof message.content !== 'string') {
    throw new Error('模型没有返回可识别的assistant文本消息。');
  }
  return { role: 'assistant', content: message.content, stopReason: choice.finish_reason };
}
// #endregion decode

// #region complete
/** 只取得一次模型结果，不把停止生成等同于任务完成。 */
export async function complete(context: Context, options: CompleteOptions): Promise<AssistantMessage> {
  if (!options.apiKey.trim()) throw new Error('缺少DEEPSEEK_API_KEY。');
  if (!options.model.trim() || context.messages.length === 0) {
    throw new Error('模型名称与消息不能为空。');
  }
  const maxTokens = options.maxTokens ?? 256;
  if (!Number.isSafeInteger(maxTokens) || maxTokens < 1) throw new Error('maxTokens需为正安全整数。');

  // 把项目Context转换成DeepSeek的messages，不修改调用方持有的原数组。
  const messages = context.systemPrompt === undefined
    ? [...context.messages]
    : [{ role: 'system', content: context.systemPrompt }, ...context.messages];
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      messages,
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
// #endregion complete
// #endregion full
