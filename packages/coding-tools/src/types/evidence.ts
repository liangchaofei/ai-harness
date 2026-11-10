// 【新增文件】文件内容、验收来源与停止后审阅的契约。
import type { ExecutableTool } from '@ai-harness/runtime';
import type { CheckResult } from './code-task';

/** 包内采集器创建的内存内容；不从公开入口导出，不是恢复检查点。 */
export interface WorkspaceSnapshot {
  /** 按相对路径排序的[路径,原文]数组；包括本次范围内的只读规则。 */
  files: readonly (readonly [string, string])[];
  /** 对完整路径和原文的确定性编码计算SHA-256；不是时间戳或Git提交号。 */
  revision: string;
}

/** 验收工具创建，随反馈发送，也由会话私有保存；模型不能填写此来源。 */
export interface CheckEvidence extends CheckResult {
  /** 启动验收前的工作区内容标识。 */
  revision: string;
  /** 验收前后两次采集相同；不承诺进程期间没有短暂变化。 */
  stable: boolean;
}

/** 会话将基线和当前内容比较后产生；应用用原文展示差异。 */
export interface FileChange {
  /** 本次固定范围中的项目相对路径。 */
  path: string;
  /** 会话创建时保存的原文。 */
  before: string;
  /** inspect时从实际文件重新取得的原文。 */
  after: string;
}

/** inspect创建的新对象；应用决定接受，不从模型总结或历史文本取证。 */
export interface CodeTaskReview {
  /** 会话创建时的完整范围标识；检查不会覆盖它。 */
  baselineRevision: string;
  /** 此次inspect重新采集的完整范围标识。 */
  currentRevision: string;
  /** 相对基线变化的原文；完全恢复的文件不会列出。 */
  changes: FileChange[];
  /** 未运行、正在运行或最近尝试异常中断时没有可用证据。 */
  lastCheck?: CheckEvidence;
  /** 最近验收前后稳定，且其revision等于此次重新采集的currentRevision。 */
  checkMatchesCurrent: boolean;
}

/** 应用持有一个任务会话；工具执行和报告读取共享同一份私有状态。 */
export interface CodeTaskSession {
  /** 交给一次Runtime运行的五个工具；它们共享本会话状态。 */
  tools: ExecutableTool[];
  /** 停止后调用；与工具操作串行使用，返回后不自动锁住文件或合入原项目。 */
  inspect: (signal?: AbortSignal) => Promise<CodeTaskReview>;
}