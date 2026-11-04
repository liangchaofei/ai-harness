// 公开入口只导出契约与调用能力，不承载服务协议实现。
// 历史联合类型增加用户消息命名及执行反馈。
export type { Message, UserMessage, AssistantMessage } from './types/messages';
export type { Context } from './types/context';
// 【修改】应用可通过公共入口指定提供商。
export type { CompleteOptions, ModelProvider } from './types/options';
// 应用通过包入口使用工具说明与请求类型。
export type { ToolDefinition, ToolCall } from './types/tools';
// 【修改】导出公共分发函数，应用不导入适配器内部文件。
export { complete } from './complete';

// 公开执行反馈消息，供 Runtime 与应用共同使用。
export type { ToolResultMessage } from './types/tool-results';
