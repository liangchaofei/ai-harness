# 04 Pi 对照与来源

设计前于2026-11-03读取Pi固定提交8efd314fa3d3232ce197d8d7a6a5660530b9d83e。原文/tmp/ai03-pi/agent-loop.ts与types.ts保留自03核对，本轮读取runLoop及streamAssistantResponse完整相关调用段。

- agent-loop.ts runLoop：调用streamAssistantResponse，检查停止状态，执行工具批次，将结果追加到currentContext.messages，随后根据工具/排队消息继续。另有外层follow-up消息队列与显式继续机制。
- 同文件streamAssistantResponse：处理上下文转换后，调用传入的streamFunction(config.model,llmContext,options)，并消费流式事件和最终消息；当前运行历史由运行层维护。
- types.ts StreamFn定义模型调用函数形状。Pi使用流式事件契约，不能把本章Promise<AssistantMessage>当作同一个接口。

本章借鉴运行循环、明确写回及调用函数注入；使用非流式ModelCall、顺序批次和显式RunResult，未实现Pi的队列、流事件、hooks、取消与上下文变换。maxModelCalls和最后一次不执行工具是本课程本阶段策略，不声称来自Pi或是所有框架的通用规则。上限统计callModel函数调用尝试数，不等于实际HTTP请求数或计费次数。

源码：
- https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/agent/src/agent-loop.ts
- https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/agent/src/types.ts

服务协议沿用03已核对的DeepSeek Chat Completions；本章未改变模型包协议、提供商或请求参数，未发付费服务请求。
