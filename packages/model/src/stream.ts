// 公共原生流入口：片段供预览，done 才携完整消息。
import type { Context } from './types/context';
import type { CompleteOptions, ResolvedCompleteOptions } from './types/options';
import type { ModelStreamEvent } from './types/stream';
import { resolveOptions } from './request-options';
import { ModelCallError } from './errors/model-call-error';
import { streamDeepSeek } from './providers/deepseek/stream';
import { streamAnthropic } from './providers/anthropic/stream';

/** 调用方用 for await 消费；不会累积对话历史，也不自动执行工具或重试。 */
export async function* stream(context: Context, options: CompleteOptions): AsyncGenerator<ModelStreamEvent> {
  // 【新增】生成器开始消费时检查，取消的调用不发送请求。
  options.signal?.throwIfAborted();
  let resolved: ResolvedCompleteOptions;
  try {
    resolved = resolveOptions(context, options);
  } catch (cause) {
    throw new ModelCallError('configuration', '模型调用配置无效，请检查所选服务和生成参数。', { cause });
  }
  try {
    // 【修改】每次向外交出片段或完整消息前，检查调用方是否仍允许继续。
    const source = resolved.provider === 'deepseek'
      ? streamDeepSeek(context, resolved) : streamAnthropic(context, resolved);
    for await (const event of source) {
      options.signal?.throwIfAborted();
      yield event;
    }
    options.signal?.throwIfAborted();
  } catch (cause) {
    // 【新增】调用方取消沿信号返回，不重新包装成服务协议故障。
    options.signal?.throwIfAborted();
    if (cause instanceof ModelCallError) throw cause;
    throw new ModelCallError('protocol', '模型流格式或消息拼接失败。', { cause });
  }
}