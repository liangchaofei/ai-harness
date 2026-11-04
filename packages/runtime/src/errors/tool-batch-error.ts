// 【新增文件】停止批次时携带已完成结果，避免丢失已发生动作的证据。
import type { ToolResultMessage } from '@ai-harness/model';
import type { RunFailure } from '../types/failures';

/** 执行器创建，runAgent 接住；不作为可继续的工具反馈发送给模型。 */
export class ToolBatchError extends Error {
  constructor(
    readonly failure: RunFailure,
    readonly completedResults: readonly ToolResultMessage[],
    options?: ErrorOptions,
  ) {
    super(failure.message, options);
    this.name = 'ToolBatchError';
  }
}