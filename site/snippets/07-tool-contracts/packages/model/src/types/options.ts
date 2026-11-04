/** 模型包当前接入的两种服务；不等于任意兼容服务都已经支持。 */
export type ModelProvider = 'deepseek' | 'anthropic';

/** 应用传给 complete；不进入对话消息。 */
export interface CompleteOptions {
  /** 省略时保留 DeepSeek；一次运行应固定同一个提供商。 */
  provider?: ModelProvider;
  /** 所选服务自己的密钥；模型包只放入请求头。 */
  apiKey: string;
  /** 服务模型 ID；应用负责选择支持当前文本与工具模式的模型。 */
  model: string;
  /** 输出 token 上限，省略时为 256；不是整次任务预算。 */
  maxTokens?: number;
  /** 默认使用全局 fetch；本地协议检查传入固定响应函数，不访问网络。
   * 此函数会接触含凭据的请求，只能由可信应用配置。
   */
  fetch?: typeof globalThis.fetch;
}

/** complete 校验后创建，两个适配器读取；不从包入口公开。 */
export interface ResolvedCompleteOptions extends CompleteOptions {
  /** 已确定的服务，不再依赖缺省规则。 */
  provider: ModelProvider;
  /** 已检查为正安全整数。 */
  maxTokens: number;
}
