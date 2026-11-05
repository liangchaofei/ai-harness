# 09 固定Pi与协议核对

设计前读取Pi提交8efd314fa3d3232ce197d8d7a6a5660530b9d83e：/tmp/ai03-pi/agent-loop.ts的streamAssistantResponse；/tmp/ai06-pi/anthropic-messages.ts的iterateSseMessages、iterateAnthropicEvents、内容块文本和partialJson拼接。远程相同固定路径复核：https://raw.githubusercontent.com/badlogic/pi-mono/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/ai/src/api/anthropic-messages.ts 。

Pi在Agent循环维护partial并替换final、发送message_update；模型侧按块索引累积文本/参数，并对message_stop缺失报错，另含修复JSON、思考、usage、完整认证/重试等。课程选择不保存partial历史，不修复未知JSON，不暴露未完工具请求，只提供text_delta/done。共享SSE更严格丢弃无空行尾帧并限制累计字符，非Pi API复制或功能等价。

2026-11-05第一方：
- https://api-docs.deepseek.com/api/create-chat-completion/ ：stream:true、delta、finish_reason、[DONE]；当前文档明确最终usage附终止choice，无单独usage-only空choices。课程只接单choice。
- https://api-docs.deepseek.com/guides/tool_calls/ ：工具请求/后续反馈职责。
- https://platform.claude.com/docs/en/build-with-claude/streaming ：message_start、content_block_start/delta/stop、input_json_delta、message_delta和message_stop，ping与错误、未知能力边界。
- https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation ：UTF8、行终止、data聚合和空行派发；不是一字节块一JSON。

课程独立选择：异步生成器单done；原complete保留且共用请求构造；Runtime可选预览通知+事件，只有完整ModelCall返回后保存；length不交付动作草稿；2Mi字符接入上限。没有真实付费请求或线上兼容/自主质量认证。

补充：HTTP成功后合法的服务错误帧使用新增service类别，对应model_service；不把服务报告失败与格式损坏混淆。WHATWG规定帧以空行派发，固定.sse材料末尾增加注释以保留终止帧分隔，注释不会成为模型事件。
