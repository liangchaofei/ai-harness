// 由原 tool-error.ts 迁入；保留原类名和单参数用法。
import type { ToolFailureCode } from '../types/tool-registry';

/** 只有明确允许交给模型的说明才放入 message；未知异常不要包装成此类。 */
export class ToolExecutionError extends Error {
  constructor(
    message: string,
    readonly code: ToolFailureCode = 'tool_failure',
  ) {
    super(message);
    this.name = 'ToolExecutionError';
  }
}
