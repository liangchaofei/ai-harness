// #region full
// 【新增文件】公开入口只导出契约与调用能力，不承载服务协议实现。
export type { Message, AssistantMessage } from './types/messages';
export type { Context } from './types/context';
export type { CompleteOptions } from './types/options';
export { complete } from './providers/deepseek';
// #endregion full
