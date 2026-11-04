# 06 Pi与服务协议核对

固定Pi提交：8efd314fa3d3232ce197d8d7a6a5660530b9d83e。设计前下载/读取，临时副本/tmp/ai06-pi；前置模型注册副本/tmp/pi-8efd314-review。不得以当前仓库默认分支解释固定版本。

- packages/ai/src/models.ts：Models.stream取得provider并处理auth后交给provider.stream；complete调用stream(...).result()（约877–907）。统一调用在ai包，Agent循环不嵌服务分支。
- packages/ai/src/providers/deepseek.ts：deepseekProvider将提供商、baseUrl、认证和openai-completions协议组合。
- packages/ai/src/providers/anthropic.ts：anthropicProvider组合不同协议和认证，支持的OAuth/环境认证远多于本章。
- packages/ai/src/api/anthropic-messages.ts：buildParams约1160起，convertMessages约1353起，assistant工具转tool_use/input，连续toolResult汇总user/tool_result，保留tool_use_id/is_error；convertTools约1622将参数转input_schema；mapStopReason约1664映射end_turn/max_tokens/tool_use并另外处理refusal等。

借鉴：项目消息与服务消息分离；provider选取不在Runtime；保留工具身份和原始结果；公共停止含义再交回循环。不同：Pi基于流并有完整模型目录/认证、思考图片、ID转换等，本章只直接fetch一次完整响应、两个固定适配器；拒绝未知停止与块而非模拟Pi全部策略。不会把Pi对pause_turn的处理照搬成当前任务完成。

2026-11-04核对第一方：

- https://api-docs.deepseek.com/api/create-chat-completion/ ：原Chat Completions消息/工具/停止协议，保留现有配置。
- https://platform.claude.com/docs/en/api/messages/create ：当前2026-10-21版本、POST /v1/messages、Bearer鉴权、system独立参数与max_tokens。
- https://platform.claude.com/docs/en/api/versioning ：明确传版本头，不默认不加头即取得固定协议。
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools ：name/description/input_schema。
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls ：tool_use的id/name/input；user/tool_result的tool_use_id/content/is_error；连续反馈紧接请求。
- https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons ：end_turn、max_tokens、tool_use与refusal/pause_turn等不同含义，不能都映射成功。
- https://platform.claude.com/docs/en/build-with-claude/thinking ：当前模型支持表显示Haiku5.5在默认medium（high及以下）支持disabled，Sonnet5.5/Opus5.5拒绝disabled。因此配置示例为claude-haiku-5-5，不称任意Claude型号可替换。
- https://platform.claude.com/docs/en/models/overview ：核对当前模型ID，未调用模型。

课程自身选择：CompleteOptions.provider缺省deepseek、可信fetch注入、关闭思考的有限模式、两分支分发、固定样本本地入口及模型ID默认。类型检查不能保证用户选择模型支持当前模式；线上HTTP失败不会静默改用另一服务/凭据。
