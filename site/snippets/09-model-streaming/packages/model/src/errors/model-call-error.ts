// 把可公开的失败分类与本地原始异常分开。
import type { ModelFailureKind } from '../types/failures';

/** 模型包创建，Runtime 读取 kind；cause 只供本地调试，不进入消息。 */
export class ModelCallError extends Error {
  constructor(
    readonly kind: ModelFailureKind,
    message: string,
    options?: ErrorOptions,
    readonly httpStatus?: number,
  ) {
    super(message, options);
    this.name = 'ModelCallError';
  }
}
