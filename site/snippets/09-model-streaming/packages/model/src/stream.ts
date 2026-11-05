// 【新增文件】公共原生流入口：片段供预览，done 才携完整消息。
import type { Context } from './types/context';
import type { CompleteOptions, ResolvedCompleteOptions } from './types/options';
import type { ModelStreamEvent } from './types/stream';
import { resolveOptions } from './request-options';
import { ModelCallError } from './errors/model-call-error';
import { streamDeepSeek } from './providers/deepseek/stream';
import { streamAnthropic } from './providers/anthropic/stream';

/** 调用方用 for await 消费；不会累积对话历史，也不自动执行工具或重试。 */
export async function* stream(context: Context, options: CompleteOptions): AsyncGenerator<ModelStreamEvent> {
  let resolved: ResolvedCompleteOptions;
  try {
    resolved = resolveOptions(context, options);
  } catch (cause) {
    throw new ModelCallError('configuration', '模型调用配置无效，请检查所选服务和生成参数。', { cause });
  }
  try {
    yield* (resolved.provider === 'deepseek' ? streamDeepSeek(context, resolved) : streamAnthropic(context, resolved));
  } catch (cause) {
    if (cause instanceof ModelCallError) throw cause;
    throw new ModelCallError('protocol', '模型流格式或消息拼接失败。', { cause });
  }
}
