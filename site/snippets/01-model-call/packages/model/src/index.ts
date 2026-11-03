// #region full
// 【新增文件】公开入口只导出契约与调用能力，不承载服务协议实现。
export type { Message, Context, AssistantMessage, CompleteOptions } from './types';
export { complete } from './providers/deepseek';
// #endregion full
