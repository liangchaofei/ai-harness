// #region full
// 【新增文件】工具说明与工具请求契约。

/** 应用创建并交给模型包的工具说明，不携带执行能力。 */
export interface ToolDefinition {
  /** 模型请求时使用的工具名称。 */
  name: string;

  /** 说明什么时候使用、能取得什么信息。 */
  description: string;

  /** 用 JSON Schema 描述参数；这里的类型不验证 schema 或实际参数。 */
  parameters: Record<string, unknown>;
}

/** 适配层从模型响应转换的单项动作请求，留给本地程序处理。 */
export interface ToolCall {
  /** 服务返回的请求 ID；后续结果要关联它，本篇检查同一列表内不重复。 */
  id: string;

  /** 模型选择的工具名称，收到名称不表示已找到或授权执行。 */
  name: string;

  /** 模型生成的原始 JSON 文本；尚未解析或通过工具参数校验。 */
  arguments: string;
}
// #endregion full
