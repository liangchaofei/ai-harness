// Runtime 使用的单次模型调用契约。
import type { AssistantMessage, Context } from '@ai-harness/model';

/** 应用提供实现；Runtime 传入本次上下文，等待一条已转换的模型消息。 */
export type ModelCall = (context: Context) => Promise<AssistantMessage>;
