// 应用和能力包只从此入口消费 Runtime。
export type { ExecutableTool } from './types/tools';
export { ToolExecutionError } from './tool-error';
export { executeTools } from './execute-tools';

// 【新增】公开运行入口及其调用契约，应用不导入 Runtime 内部文件。
export type { ModelCall } from './types/model-call';
export type { RunAgentOptions, RunResult } from './types/run';
export { runAgent } from './run-agent';