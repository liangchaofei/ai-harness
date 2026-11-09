// 工具结果消息的类型定义；本文件不执行工具或创建结果对象。
/**
 * 约定工具结果进入模型上下文时的消息格式。
 * Runtime 创建符合此类型的结果对象，应用追加到对话记录；
 * 模型包在下一次调用时，将记录中的结果对象转换为服务的 tool 消息。
 */
export interface ToolResultMessage {
  /** 与用户消息、模型消息区分；这是项目内部角色名。 */
  role: 'toolResult';
  /** 原请求的 id；不能另造一个 ID 替代。 */
  toolCallId: string;
  /** 原请求的工具名，供本地观察，不作为服务消息的 name 发送。 */
  toolName: string;
  /** 工具返回的文本，或可反馈的失败说明。 */
  content: string;
  /** true 表示本次工具未成功，不表示整个任务已终止。 */
  isError: boolean;
}
