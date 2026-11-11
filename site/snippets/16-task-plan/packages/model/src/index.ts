// 公开入口只导出契约与调用能力，不承载服务协议实现。
// 历史联合类型增加用户消息命名及执行反馈。
export type { Message, UserMessage, AssistantMessage } from './types/messages';
export type { Context } from './types/context';
export type { CompleteOptions, ModelProvider } from './types/options';
// 应用通过包入口使用工具说明与请求类型。
export type { ToolDefinition, ToolCall } from './types/tools';
export { complete } from './complete';

// 公开执行反馈消息，供 Runtime 与应用共同使用。
export type { ToolResultMessage } from './types/tool-results';

// 调用方按类别判断，不读取原始服务异常正文。
export { ModelCallError } from './errors/model-call-error';
export type { ModelFailureKind } from './types/failures';

// 非流式 complete 保留，原生流使用独立入口。
export { stream } from './stream';
export type { ModelStreamEvent } from './types/stream';
