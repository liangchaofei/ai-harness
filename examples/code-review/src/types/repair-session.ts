// 应用持有工作副本与运行输入，不属于Runtime协议。
// 【新增】应用保留库返回的会话，停止后重新读取实际内容。
import type { CodeTaskSession } from '@ai-harness/coding-tools';
import type { ExampleTask } from '../../../shared/types/task';

/** 应用准备并交给运行入口；保留副本供停止后审阅。 */
export interface RepairSession {
  /** 本次独立临时目录；不指向原fixtures。 */
  root: string;
  /** 【修改】基线与验收状态由代码任务会话持有，应用只保留公开句柄。 */
  codeTask: CodeTaskSession;
  /** 目标与工具，凭据、运行预算、事件仍由入口配置。 */
  input: ExampleTask['input'];
}