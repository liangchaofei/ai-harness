// 历史消息能够保存完整动作与对应反馈。
import type { ToolCall } from './tools';
import type { ToolResultMessage } from './tool-results';

/** 应用根据用户任务创建，模型包读取的输入消息。 */
export interface UserMessage {
  role: 'user';
  /** 用户要求；文件内容由后续工具结果提供。 */
  content: string;
}

/** 模型包转换服务响应后的生成结果；应用决定如何继续并保存。 */
export interface AssistantMessage {
  role: 'assistant';
  /** 模型文字，可为空；不能当成本地执行证据。 */
  content: string;
  /** stop 正常停止；length 截断；toolUse 请求执行工具。 */
  stopReason: 'stop' | 'length' | 'toolUse';
  /** 按服务返回顺序保留的全部请求；纯文本消息为空数组。 */
  toolCalls: readonly ToolCall[];
}

/** 应用持有的对话记录项；保留角色才能正确组装下一次输入。 */
export type Message = UserMessage | AssistantMessage | ToolResultMessage;
