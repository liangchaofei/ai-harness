// 【新增文件】展示应用持有的计划副本，不改计划或运行状态。
import type { PlanSnapshot } from '@ai-harness/runtime';
import { logBlock } from '../../../shared/terminal';

/** 应用在更新工具结束或最终报告时调用；状态来自模型声明，不是自动验收。 */
export function printPlan(plan: PlanSnapshot): void {
  const labels = { pending: '待处理', in_progress: '进行中', completed: '已声明完成' };
  logBlock(`任务计划 · revision ${plan.revision}`, plan.steps.length
    ? plan.steps.map((item, index) => `${index + 1}. [${labels[item.status]}] ${item.step}`).join('\n')
    : '尚未建立计划');
  if (plan.explanation) logBlock('计划更新说明（模型声明）', plan.explanation);
}