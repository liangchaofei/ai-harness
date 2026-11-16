// 【修改】CLI 仍从自身环境选择模型，与其他宿主复用配置转换。
import { createConfiguredModelCall } from '@ai-harness/harness';

/** 参数与任务配置通过后，才由 CLI 传入自己的进程环境。 */
export function createModelCall() {
  return createConfiguredModelCall(process.env);
}
