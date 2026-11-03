// #region full
// 【新增文件】应用组织的本次模型输入。
import type { Message } from './messages';

/**
 * 应用交给模型包的本次输入：总体要求与对话消息。
 * 应用持有这份上下文；complete 读取后发起请求，不自动追加返回的回答。
 */
export interface Context {
  /** 可省略的总体要求；提供时，模型包将其转换为一条 system 消息。 */
  systemPrompt?: string;

  /** 本次提供给模型的对话；readonly 限制通过此类型增删或替换数组项，不冻结消息对象。 */
  messages: readonly Message[];
}
// #endregion full
