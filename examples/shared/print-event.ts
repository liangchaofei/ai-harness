// 【新增文件】应用决定怎样展示实时进度，Runtime 不依赖终端。
import type { RunEvent } from '@ai-harness/runtime';

/** 每收到一个事件打印一次；这里的 JSON 是 Runtime 摘要，不是模型原始响应。 */
export function printEvent(event: RunEvent): void {
  console.log('运行事件（event）：', JSON.stringify(event));
}