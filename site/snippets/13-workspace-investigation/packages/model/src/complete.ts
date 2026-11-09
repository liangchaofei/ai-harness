// 提供商入口归入各自目录，公共 complete 调用与异常处理保留。
// 配置、HTTP和消息转换分别归类，原始异常只作为 cause 保留。
import type { Context } from './types/context';
import type { AssistantMessage } from './types/messages';
import type { CompleteOptions, ResolvedCompleteOptions } from './types/options';
import { resolveOptions } from './request-options';
import { completeDeepSeek } from './providers/deepseek/deepseek';
import { completeAnthropic } from './providers/anthropic/anthropic';
import { ModelCallError } from './errors/model-call-error';

/** 仍只返回一次模型消息，不保存历史，也不在失败时自动重试。 */
export async function complete(context: Context, options: CompleteOptions): Promise<AssistantMessage> {
  // 已经取消时不编码或发请求。
  options.signal?.throwIfAborted();
  let resolved: ResolvedCompleteOptions;
  try {
    resolved = resolveOptions(context, options);
  } catch (cause) {
    throw new ModelCallError('configuration', '模型调用配置无效，请检查所选服务和生成参数。', { cause });
  }
  try {
    const message = await (resolved.provider === 'deepseek'
      ? completeDeepSeek(context, resolved)
      : completeAnthropic(context, resolved));
    // 自定义传输即使忽略信号，迟到的完整响应也不交付。
    options.signal?.throwIfAborted();
    return message;
  } catch (cause) {
    // 调用方取消沿信号返回，不重新包装成服务协议故障。
    options.signal?.throwIfAborted();
    if (cause instanceof ModelCallError) throw cause;
    throw new ModelCallError('protocol', '模型消息编码或解码失败。', { cause });
  }
}
