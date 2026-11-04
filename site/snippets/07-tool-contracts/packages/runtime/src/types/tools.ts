// 【修改】结构校验由 Runtime 统一接线，工具继续守住具体执行边界。
// 通用执行器使用的本地工具契约。
import type { ToolDefinition } from '@ai-harness/model';

/** 应用注入 Runtime 的工具：说明给模型，execute 留在本地。 */
export interface ExecutableTool extends ToolDefinition {
  /** Runtime 传入已按 schema 检查的数据；静态类型仍为 unknown，工具检查语义与执行范围后返回文本。 */
  execute: (argumentsValue: unknown) => Promise<string>;
}
