// 内部文件归组，原公开函数和错误类名称保留。
// 应用和能力包只从此入口消费 Runtime。
export type { ExecutableTool } from './types/tools';
export { ToolExecutionError } from './errors/tool-execution-error';
export { executeTools } from './tools/execute';

// 公开运行入口及其调用契约，应用不导入 Runtime 内部文件。
export type { ModelCall } from './types/model-call';
export type { RunAgentOptions, RunResult } from './types/run';
export { runAgent } from './run-agent';

// 公开受控失败类型；批次内部错误不从包入口导出。
export type { RunFailure, RunFailureCode } from './types/failures';
export type { ToolFailureCode } from './types/tool-registry';

// 应用只通过包入口使用事件契约。
export type { RunEvent, RunEventListener } from './types/events';

// 可选任务进度，原循环与事件契约保持不变。
export { createPlanSession } from './planning/session';
export type {
  PlanStepStatus,
  PlanStep,
  PlanUpdate,
  PlanSnapshot,
  PlanSession,
} from './types/plan';

// 【新增】只公开应用回调类型，复制与组装函数留在包内。
export type { PrepareMessages } from './types/input';
