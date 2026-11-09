// 【新增文件】应用持有工作副本与运行输入，不属于Runtime协议。
import type { ExampleTask } from '../../../shared/types/task';

/** 应用准备并交给运行入口；保留副本供停止后审阅。 */
export interface RepairSession {
  /** 本次独立临时目录；不指向原fixtures。 */
  root: string;
  /** 修改前的计算文件原文，供停止后展示差异；不是检查点。 */
  before: string;
  /** 目标与工具，凭据、运行预算、事件仍由入口配置。 */
  input: ExampleTask['input'];
}