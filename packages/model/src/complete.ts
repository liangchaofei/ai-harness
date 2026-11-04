// 【新增文件】公共调用入口选择适配器，不维护对话历史。
import type { Context } from './types/context';
import type { AssistantMessage } from './types/messages';
import type { CompleteOptions } from './types/options';
import { resolveOptions } from './request-options';
import { completeDeepSeek } from './providers/deepseek';
import { completeAnthropic } from './providers/anthropic';

/** 应用调用同一个函数；两个适配器都返回项目的 AssistantMessage。 */
export async function complete(context: Context, options: CompleteOptions): Promise<AssistantMessage> {
  const resolved = resolveOptions(context, options);
  return resolved.provider === 'deepseek'
    ? completeDeepSeek(context, resolved)
    : completeAnthropic(context, resolved);
}