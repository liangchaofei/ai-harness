// 【新增文件】仅供 Anthropic 编码器使用，不从包入口公开。
/** 编码器把项目文本转换为服务的文本块。 */
export interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

/** 编码器重建历史中的工具请求；服务要求 input 是对象。 */
export interface AnthropicToolUseBlock {
  type: 'tool_use';
  /** 复制原 ToolCall.id，供下一条结果关联。 */
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/** 编码器把 Runtime 已保存的结果转换为用户消息中的反馈块。 */
export interface AnthropicToolResultBlock {
  type: 'tool_result';
  /** 复制 ToolResultMessage.toolCallId，不创建新身份。 */
  tool_use_id: string;
  content: string;
  is_error: boolean;
}

/** 发送用消息；不替换 Runtime 内部 Message。 */
export type AnthropicMessage =
  | { role: 'user'; content: (AnthropicTextBlock | AnthropicToolResultBlock)[] }
  | { role: 'assistant'; content: (AnthropicTextBlock | AnthropicToolUseBlock)[] };