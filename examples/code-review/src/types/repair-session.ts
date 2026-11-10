// 应用持有工作副本与运行输入，不属于Runtime协议。
// 应用保留库返回的会话，停止后重新读取实际内容。
import type { CodeTaskSession } from '@ai-harness/coding-tools';
// 【新增】应用持有可选计划记录，不能据此替代代码任务验收。
import type { PlanSession } from '@ai-harness/runtime';
import type { ExampleTask } from '../../../shared/types/task';

/** 应用准备并交给运行入口；保留副本供停止后审阅。 */
/** 【新增】由入口选择的实验策略；默认关闭，不增加运行额度。 */
export interface RepairOptions {
  planning?: boolean;
}

export interface RepairSession {
  /** 【新增】只在本次启用计划时创建；不与别的运行共享。 */
  plan?: PlanSession;
  /** 本次独立临时目录；不指向原fixtures。 */
  root: string;
  /** 基线与验收状态由代码任务会话持有，应用只保留公开句柄。 */
  codeTask: CodeTaskSession;
  /** 目标与工具，凭据、运行预算、事件仍由入口配置。 */
  input: ExampleTask['input'];
}