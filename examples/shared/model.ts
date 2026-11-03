// 【新增文件】两个示例共用的模型接入配置，仍属于应用侧。
import { complete } from '@ai-harness/model';
import type { ModelCall } from '@ai-harness/runtime';

/** 应用启动时创建调用函数；Runtime 每次传入最新上下文，凭据留在闭包中。 */
export function createModelCall(): ModelCall {
  const options = {
    apiKey: process.env.DEEPSEEK_API_KEY?.trim() ?? '',
    model: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-flash',
    maxTokens: 256,
  };
  return (context) => complete(context, options);
}