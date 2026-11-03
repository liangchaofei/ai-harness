// 模型输入与返回消息。
import type { ToolCall } from './tools';

/**
 * 上下文中的一条文本消息。
 * 应用组织输入时创建，模型包读取它并转换为服务消息。
 */
export interface Message {
  /** user 表示用户侧输入，assistant 表示已有模型回答；本篇输入只有 user 消息。 */
  role: 'user' | 'assistant';

  /** 该角色提供的文本，例如本次审查要求与待审查代码。 */
  content: string;
}

// 【修改】返回消息增加工具请求列表与toolUse停止原因。
/**
 * 模型包检查并转换服务响应后返回的消息，可包含文字与工具请求。
 * 应用接收它，再决定是否展示；取得消息不等于任务完成。
 */
export interface AssistantMessage {
  /** 固定为 assistant，标明这条生成结果来自模型。 */
  role: 'assistant';

  /** 本次生成的文本，可能为空或被截断，由应用决定如何处理。 */
  content: string;

  /** stop 正常停止，length 达到生成上限，toolUse 请求工具；均不证明任务完成。 */
  stopReason: 'stop' | 'length' | 'toolUse';

  /** 全部工具请求，保持返回顺序；纯文本结果为空数组。 */
  toolCalls: readonly ToolCall[];
}