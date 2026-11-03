// #region full
// 【新增文件】借鉴Pi的输入上下文与assistant消息边界；本篇仅支持文本。

/**
 * 上下文中的一条文本消息。
 * 应用组织输入时创建，模型包读取它并转换为服务消息。
 */
export interface Message {
  /** user 表示用户侧输入，assistant 表示已有模型回答；本篇输入只有 user 消息。 */
  role: 'user' | 'assistant';

  /** 该角色提供的文本，例如本次审查要求与待审查代码。 */
  content: string;
}

/**
 * 应用交给模型包的本次输入：总体要求与对话消息。
 * 应用持有这份上下文；complete 读取后发起请求，不自动追加返回的回答。
 */
export interface Context {
  /** 可省略的总体要求；提供时，模型包将其转换为一条 system 消息。 */
  systemPrompt?: string;

  /** 本次提供给模型的对话；readonly 限制通过此类型增删或替换数组项，不冻结消息对象。 */
  messages: readonly Message[];
}

/**
 * 模型包检查并转换服务响应后返回的一条文本消息。
 * 应用接收它，再决定是否展示；取得消息不等于任务完成。
 */
export interface AssistantMessage {
  /** 固定为 assistant，标明这条生成结果来自模型。 */
  role: 'assistant';

  /** 本次生成的文本，可能为空或被截断，由应用决定如何处理。 */
  content: string;

  /** stop 表示正常停止，length 表示达到生成上限；两者都不证明回答正确。 */
  stopReason: 'stop' | 'length';
}

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
// #endregion full
