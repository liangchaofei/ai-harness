// 显式任务进度；不是模型隐藏思维，也不是任务验收证据。
import type { ExecutableTool } from './tools';

/** 模型声明的单项进度；完成后发现新问题可以退回pending或in_progress。 */
export type PlanStepStatus = 'pending' | 'in_progress' | 'completed';

/** 模型通过工具提出，本地检查后复制保存；不是自动执行的任务节点。 */
export interface PlanStep {
  /** 1..160字符的简短动作说明；不记录私密推理。 */
  step: string;
  status: PlanStepStatus;
}

/** 一次更新的参数；模型使用上次成功反馈的revision填写expectedRevision。 */
export interface PlanUpdate {
  expectedRevision: number;
  /** 本次公开的更新说明，如实际验收失败后需要修正；不充当证据。 */
  explanation: string;
  /** 完整替换当前列表；1..6项，最多一项in_progress。 */
  steps: PlanStep[];
}

/** 会话创建的当前计划；初始revision0、空列表，更新成功才递增。 */
export interface PlanSnapshot {
  /** 计划更新序号，不是源码哈希或Git提交号。 */
  revision: number;
  explanation: string;
  steps: PlanStep[];
}

/** 应用每次运行单独创建；计划记录与Runtime消息历史分开持有。 */
export interface PlanSession {
  /** 作为可选工具加入本次清单；循环按原规则执行与保存反馈。 */
  tool: ExecutableTool;
  /** 返回当前记录的深拷贝，供终端显示；不创建持久化检查点。 */
  read: () => PlanSnapshot;
}
