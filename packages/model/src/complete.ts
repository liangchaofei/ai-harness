// 【修改】配置、HTTP和消息转换分别归类，原始异常只作为 cause 保留。
import type { Context } from './types/context';
import type { AssistantMessage } from './types/messages';
import type { CompleteOptions, ResolvedCompleteOptions } from './types/options';
import { resolveOptions } from './request-options';
import { completeDeepSeek } from './providers/deepseek/deepseek';
import { completeAnthropic } from './providers/anthropic/anthropic';
import { ModelCallError } from './errors/model-call-error';

/** 仍只返回一次模型消息，不保存历史，也不在失败时自动重试。 */
export async function complete(context: Context, options: CompleteOptions): Promise<AssistantMessage> {
  let resolved: ResolvedCompleteOptions;
  try {
    resolved = resolveOptions(context, options);
  } catch (cause) {
    throw new ModelCallError('configuration', '模型调用配置无效，请检查所选服务和生成参数。', { cause });
  }
  try {
    return await (resolved.provider === 'deepseek'
      ? completeDeepSeek(context, resolved)
      : completeAnthropic(context, resolved));
  } catch (cause) {
    if (cause instanceof ModelCallError) throw cause;
    throw new ModelCallError('protocol', '模型消息编码或解码失败。', { cause });
  }
}