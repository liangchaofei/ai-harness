// 【新增文件】从宿主传入的配置绑定模型。只在宿主调用时读取这些值。
import { stream, type CompleteOptions } from '@ai-harness/model';
import type { ModelCall } from '@ai-harness/runtime';

/** 调用方提供配置，返回给 Runtime 的模型回调不会读取环境。 */
export function createConfiguredModelCall(env: Readonly<Record<string, string | undefined>>): ModelCall {
  const provider = env.MODEL_PROVIDER?.trim() || 'deepseek';
  if (provider !== 'deepseek' && provider !== 'anthropic') {
    throw new Error('模型提供商无效。');
  }
  const options: CompleteOptions =
    provider === 'deepseek'
      ? {
          provider,
          apiKey: env.DEEPSEEK_API_KEY?.trim() ?? '',
          model: env.DEEPSEEK_MODEL?.trim() || 'deepseek-flash',
          maxTokens: 1024,
        }
      : {
          provider,
          apiKey: env.ANTHROPIC_API_KEY?.trim() ?? '',
          model: env.ANTHROPIC_MODEL?.trim() || 'claude-haiku-5-5',
          maxTokens: 1024,
        };
  if (!options.apiKey) {
    throw new Error('缺少服务凭据。');
  }
  return async (context, onTextDelta, signal) => {
    for await (const event of stream(context, {
      ...options,
      signal,
    })) {
      if (event.type === 'text_delta') {
        await onTextDelta?.(event.text);
      } else {
        return event.message;
      }
    }
    throw new Error('模型流缺少完整消息。');
  };
}
