import type { CompleteOptions } from '@ai-harness/model';
// 复用模型流到 Runtime 单次调用的连接。
import { createStreamingModelCall } from './stream-model';
import type { ModelCall } from '@ai-harness/runtime';

/** 两个示例共用；创建本次运行固定使用的模型调用函数。 */
export function createModelCall(): ModelCall {
  const provider = process.env.MODEL_PROVIDER?.trim() || 'deepseek';
  if (provider !== 'deepseek' && provider !== 'anthropic') {
    throw new Error('MODEL_PROVIDER 只能是 deepseek 或 anthropic。');
  }
  const options: CompleteOptions =
    provider === 'deepseek'
      ? {
          provider,
          apiKey: process.env.DEEPSEEK_API_KEY?.trim() ?? '',
          model: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-flash',
          maxTokens: 256,
        }
      : {
          provider,
          apiKey: process.env.ANTHROPIC_API_KEY?.trim() ?? '',
          model: process.env.ANTHROPIC_MODEL?.trim() || 'claude-haiku-5-5',
          maxTokens: 256,
        };
  // 两种真实入口及本地观察共用流消费接线。
  return createStreamingModelCall(options);
}
