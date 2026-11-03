# 03 来源核对

核对日期2026-11-03。Pi 固定提交 `8efd314fa3d3232ce197d8d7a6a5660530b9d83e`，设计前读取对应实现，临时原文存于 /tmp/ai03-pi。

- `packages/agent/src/types.ts` 的 AgentTool：扩展工具说明并有execute；本课程用ExecutableTool，参数unknown由工具检查，返回文本。
- `packages/agent/src/agent-loop.ts`：executeToolCalls会选择顺序/并行；executeToolCallsSequential逐项准备、执行、生成结果；prepareToolCall找工具、validateToolArguments与hooks；createToolResultMessage把原id/name放到toolCallId/toolName并带isError。runLoop收到整个批次的messages后写入currentContext.messages，再决定继续。
- Pi截断工具批次生成失败结果；本章截断直接停止且不执行。Pi会把多种执行异常变成失败结果；本章只把ToolExecutionError变成反馈，未知异常向入口抛出。两者不同，不声称复刻Pi。
- Pi的content是内容块、参数已解析且有schema验证、事件、取消、并行、hooks等；本章纯文本、Runtime JSON.parse加工具专用检查，无通用schema引擎、事件、循环、取消、持久化。
- DeepSeek Chat Completions API：https://api-docs.deepseek.com/api/create-chat-completion/ 。核对assistant/tool消息、tool_calls、tool_call_id及函数参数文本。项目toolResult/isError不是服务原生字段：编码为tool角色、关联ID及包含错误状态的content JSON文本。不直接展开内部对象。

源码链接：https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/agent/src/agent-loop.ts
