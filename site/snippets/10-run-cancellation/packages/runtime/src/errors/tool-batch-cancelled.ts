// 【新增文件】取消批次时，把此前已经完成的结果交还循环。
import type { ToolResultMessage } from '@ai-harness/model';

/** 执行器创建，runAgent 接住；只供包内使用，不作为工具失败反馈给模型。 */
export class ToolBatchCancelled extends Error {
  constructor(readonly completedResults: readonly ToolResultMessage[]) {
    super('工具批次已取消。');
    this.name = 'ToolBatchCancelled';
  }
}
