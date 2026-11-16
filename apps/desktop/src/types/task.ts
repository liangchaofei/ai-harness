// 【新增文件】主进程允许传给桌面视图的数据。
import type { RunResult } from '@ai-harness/harness';

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
}

/** 实时事件只保留阶段与顺序，不发送 Runtime 消息。 */
export interface DesktopTaskEvent {
  /** 同一运行内的顺序，可跨过未投影事件。 */
  sequence: number;
  /** 可以展示的阶段摘要。 */
  label: string;
}
