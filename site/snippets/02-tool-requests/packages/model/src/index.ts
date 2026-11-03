// #region full
// 公开入口只导出契约与调用能力，不承载服务协议实现。
export type { Message, AssistantMessage } from './types/messages';
export type { Context } from './types/context';
export type { CompleteOptions } from './types/options';
// 【新增】应用通过包入口使用工具说明与请求类型。
export type { ToolDefinition, ToolCall } from './types/tools';
export { complete } from './providers/deepseek';
// #endregion full
