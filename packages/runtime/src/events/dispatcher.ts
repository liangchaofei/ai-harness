// 【新增文件】为一次运行添加事件身份，隔离观察函数的异常。
import { randomUUID } from 'node:crypto';
import type { RunEvent, RunEventData, RunEventListener } from '../types/events';

/** 每次 runAgent 创建一份；不保存消息，也不维护跨运行的全局订阅表。 */
export function createRunEvents(listener?: RunEventListener) {
  const runId = randomUUID();
  let sequence = 0;
  let observerErrors = 0;

  return {
    runId,
    errorCount: () => observerErrors,
    async emit(data: RunEventData): Promise<void> {
      // 事件只有原始值；冻结这一层即可防止监听方改写当前事件。
      const event: RunEvent = Object.freeze({ ...data, runId, sequence: ++sequence });
      try {
        // 等待可以保持观察顺序，但慢监听方也会延迟下一步。
        await listener?.(event);
      } catch {
        // 观察失败不伪装成模型或工具失败；包括 async 函数的拒绝。
        observerErrors += 1;
      }
    },
  };
}