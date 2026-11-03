// 通用执行器使用的本地工具契约。
import type { ToolDefinition } from '@ai-harness/model';

/** 应用注入 Runtime 的工具：说明给模型，execute 留在本地。 */
export interface ExecutableTool extends ToolDefinition {
  /** Runtime 传入 JSON 解析后的未知数据；工具校验后才执行，返回可反馈文本。 */
  execute: (argumentsValue: unknown) => Promise<string>;
}
