// 工具额度不足时，把此前已经完成的结果带回循环。
import type { ToolResultMessage } from '@ai-harness/model';

/** 执行器创建、runAgent 接住；不作为模型可继续反馈的工具失败。 */
export class ToolBatchLimit extends Error {
  constructor(readonly completedResults: readonly ToolResultMessage[]) {
    super('工具处理预算已耗尽。');
    this.name = 'ToolBatchLimit';
  }
}
