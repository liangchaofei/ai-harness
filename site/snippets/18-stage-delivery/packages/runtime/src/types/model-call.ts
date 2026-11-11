// Runtime 使用的单次模型调用契约。
import type { AssistantMessage, Context } from '@ai-harness/model';

/** 应用提供实现；Runtime 传入本次上下文，等待一条已转换的模型消息。 */
export type ModelCall = (
  context: Context,
  /** 可省略的文字预览通知；旧的单参数函数仍可使用，返回值仍是完整消息。 */
  onTextDelta?: (text: string) => Promise<void>,
  // Runtime 传入运行信号；实现需向模型接入继续传递。
  signal?: AbortSignal,
) => Promise<AssistantMessage>;
