// 主进程允许传给桌面视图的数据。
import type { RunResult } from '@ai-harness/harness';
import type { DesktopTaskId } from '../tasks';

/** 每次运行返回的简短结果，由主进程从验收证据提取。 */
export interface DesktopTaskResult {
  /** Runtime 停止原因，例如 answered 或 cancelled。 */
  status: RunResult['status'];
  /** 当前副本的匹配验收标记。 */
  checkMatchesCurrent: boolean;
  /** 是否有当前内容上的成功验收退出码。 */
  checkPassed: boolean;
  /** 与 Coding CLI 共用的交付判定。 */
  accepted: boolean;
  /** 仅展示相对文件名。 */
  changedFiles: string[];
  /** 【新增】审阅时保存的相对路径及修改前后原文。 */
  changes: Array<{ path: string; before: string; after: string }>;
  /** 【新增】已观察到的验收终态。没有可用验收时为空。 */
  check: { status: 'passed' | 'failed' | 'timedOut' | 'outputLimit'; exitCode: number | null } | null;
}

/** 实时事件只保留阶段与顺序，不发送 Runtime 消息。 */
export interface DesktopTaskEvent {
  /** 同一运行内的顺序，可跨过未投影事件。 */
  sequence: number;
  /** 可以展示的阶段摘要。 */
  label: string;
}

/** 【新增】主进程保存的审阅快照。任务副本清理后仍可读取。 */
export interface DesktopRunRecord {
  version: 1;
  id: string;
  finishedAt: string;
  taskId: DesktopTaskId;
  modelMode: 'fixed' | 'live';
  events: DesktopTaskEvent[];
  result: DesktopTaskResult;
}

/** 【新增】只供窗口展示与决定，审批参数不写入审阅历史。 */
export interface DesktopApproval {
  /** 主进程为该请求生成的唯一 ID。 */
  id: string;
  /** 需要批准的具体动作。 */
  toolName: 'replace_text' | 'run_check';
  /** 展示给用户审阅的参数文本。 */
  argumentsText: string;
}
