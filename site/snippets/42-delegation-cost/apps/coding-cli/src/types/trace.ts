// 【新增文件】应用轨迹中允许随父 run_end 保存的子运行计数。
import type { RunResult } from '@ai-harness/runtime';

/** 来自实际子运行结果，由 CLI 收集。禁止携带子消息或查到的正文。 */
export interface ChildRunSummary {
  /** Runtime 给子运行分配的身份，区别于父 runId。 */
  childRunId: string;
  /** 子运行停止时的状态。 */
  status: RunResult['status'];
  /** 子运行实际发起的模型次数。 */
  modelCalls: number;
  /** 子运行开始处理的工具项数。 */
  toolCalls: number;
}
