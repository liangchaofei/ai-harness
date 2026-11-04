// 应用组织的本次模型输入。
import type { Message } from './messages';
// 上下文可携带工具说明。
import type { ToolDefinition } from './tools';

/**
 * 应用交给模型包的本次输入：总体要求与对话消息。
 * 应用持有这份上下文；complete 读取后发起请求，不自动追加返回的回答。
 */
export interface Context {
  /** 可省略的总体要求；提供时，模型包将其转换为一条 system 消息。 */
  systemPrompt?: string;

  /** 本次提供给模型的对话；readonly 限制通过此类型增删或替换数组项，不冻结消息对象。 */
  messages: readonly Message[];

  // 让工具说明随本次上下文传入模型包。
  /** 应用提供的工具清单；省略时保持纯文本调用。 */
  tools?: readonly ToolDefinition[];
}
