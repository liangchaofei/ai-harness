// 公开 CLI 和独立宿主共用的任务运行入口。
export { runAgent } from '@ai-harness/runtime';
export type { ModelCall, RunAgentOptions, RunEvent, RunResult } from '@ai-harness/runtime';
export { createCodeTaskSession } from '@ai-harness/coding-tools';
export type { CodeTaskOptions, CodeTaskReview, CodeTaskSession } from '@ai-harness/coding-tools';
export { acceptTask } from './accept-task';
// 【新增】两个宿主共用同一运行与审阅入口。
export { createCodeTaskRunner } from './code-task-runner';
export type { CodeTaskRunner, CodeTaskRunOptions, CodeTaskDelivery } from './types/code-task-runner';

// 【新增】宿主显式传入模型服务配置。
export { createConfiguredModelCall } from './configured-model';
