//一次模型调用的连接与生成配置。

/**
 * 应用传给 complete 的连接与生成配置，与 Context 分开。
 * 模型包用它构造请求，不把这些配置作为对话内容发送。
 */
export interface CompleteOptions {
  /** 服务鉴权密钥，放入请求头；不写入对话或日志。 */
  apiKey: string;

  /** 请求使用的服务模型名称，由应用选择。 */
  model: string;

  /** 输出 token 上限；省略时 complete 使用 256，提供时须为正安全整数。 */
  maxTokens?: number;
}
