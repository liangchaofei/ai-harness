// 【新增文件】终端应用选择服务并绑定凭据，Runtime不读取进程环境。
import { stream, type CompleteOptions } from '@ai-harness/model';
import type { ModelCall } from '@ai-harness/runtime';

/** main在参数和任务配置通过后调用；帮助与坏参数不会触碰模型。 */
export function createModelCall(): ModelCall {
  const provider = process.env.MODEL_PROVIDER?.trim() || 'deepseek';
  if (provider !== 'deepseek' && provider !== 'anthropic') {
    throw new Error('模型提供商无效。');
  }
  const options: CompleteOptions =
    provider === 'deepseek'
      ? {
          provider,
          apiKey: process.env.DEEPSEEK_API_KEY?.trim() ?? '',
          model: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-flash',
          maxTokens: 1024,
        }
      : {
          provider,
          apiKey: process.env.ANTHROPIC_API_KEY?.trim() ?? '',
          model: process.env.ANTHROPIC_MODEL?.trim() || 'claude-haiku-5-5',
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