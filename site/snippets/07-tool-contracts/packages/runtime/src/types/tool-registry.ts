// 【新增文件】工具准备与已知失败反馈的类型。
import type { ValidateFunction } from 'ajv';
import type { ExecutableTool } from './tools';

/** 已知工具失败的稳定代码，由执行器或可信工具实现选择。 */
export type ToolFailureCode = 'unknown_tool' | 'invalid_json' | 'invalid_arguments' | 'tool_failure';

/** 注册阶段创建；本次运行复用校验函数和工具快照，不从包入口导出。 */
export interface RegisteredTool extends ExecutableTool {
  /** Ajv 从本工具 schema 编译的同步检查；不会把输入自动转换或补默认值。 */
  validate: ValidateFunction;
}
