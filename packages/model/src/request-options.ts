// 【新增文件】两家服务共用的调用前检查。
import type { Context } from './types/context';
import type { CompleteOptions, ResolvedCompleteOptions } from './types/options';

/** complete 在编码和发送前调用；返回新配置，不修改应用传入的对象。 */
export function resolveOptions(context: Context, options: CompleteOptions): ResolvedCompleteOptions {
  const provider = options.provider ?? 'deepseek';
  if (provider !== 'deepseek' && provider !== 'anthropic') {
    throw new Error('不支持的模型提供商。');
  }
  if (!options.apiKey.trim()) throw new Error('缺少所选模型服务的 API Key。');
  if (!options.model.trim() || context.messages.length === 0) {
    throw new Error('模型名称与消息不能为空。');
  }
  const maxTokens = options.maxTokens ?? 256;
  if (!Number.isSafeInteger(maxTokens) || maxTokens < 1) {
    throw new Error('maxTokens 需为正安全整数。');
  }
  return { ...options, provider, maxTokens };
}