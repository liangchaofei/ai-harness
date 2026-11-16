// 【新增文件】宿主通过公开包入口使用的代码任务运行契约。
import type { CodeTaskReview } from '@ai-harness/coding-tools';
import type { RunAgentOptions, RunResult } from '@ai-harness/runtime';

/** 默认使用当前会话的工具。宿主可传入经过权限装配的工具清单。 */
export interface CodeTaskRunOptions extends Omit<RunAgentOptions, 'tools'> {
  /** 显式传入空数组表示本段禁用全部工具。 */
  tools?: RunAgentOptions['tools'];
}

/** 当前副本审阅和统一交付判断，由 runner 在 review 时生成。 */
export interface CodeTaskDelivery {
  /** 审阅当时的变更和验收证据。 */
  review: CodeTaskReview;
  /** 是否满足共享接受规则。 */
  accepted: boolean;
}

/** 一份代码任务会话绑定一个 runner，同一时刻只执行一个操作。 */
export interface CodeTaskRunner {
  /** 使用宿主提供的模型、信号和事件回调执行一段运行。 */
  run(options: CodeTaskRunOptions): Promise<RunResult>;
  /** 核对最近一段的结果和当前副本。可在运行取消后独立调用。 */
  review(result: RunResult, signal?: AbortSignal): Promise<CodeTaskDelivery>;
}
