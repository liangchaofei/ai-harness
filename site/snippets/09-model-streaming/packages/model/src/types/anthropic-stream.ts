// 【新增文件】Anthropic 流适配器持有的局部块草稿，不从包入口公开。
/** 由 content_block_start 创建，后续 delta 只追加同一块；不是可执行工具。 */
export type AnthropicBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; json: string };
