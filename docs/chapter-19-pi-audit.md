# 19 来源核对

设计前阅读固定Pi提交8efd314fa3d3232ce197d8d7a6a5660530b9d83e：

- packages/agent/src/agent-loop.ts的streamAssistantResponse：局部messages从context.messages取得，经transformContext，再convertToLlm，normalizeContext后调用streamFunction；最终响应另写回context.messages。
- packages/agent/src/types.ts的AgentLoopConfig：transformContext对AgentMessage工作，convertToLlm转换为模型兼容消息；源注释要求回调不抛错。prepareRequest会替换运行上下文，不是本篇只改变输入副本的接口，不能混淆。

本项目借鉴模型调用前的消息准备职责；没有自定义AgentMessage转换层。消息复制、准备异常受控停止、准备成功事件与不占模型调用额度为本项目选择，不宣称Pi提供同样保护或相同错误契约。没有实现裁剪、摘要和恢复。

来源：
- https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/agent/src/agent-loop.ts
- https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/agent/src/types.ts
- https://nodejs.org/api/globals.html#abortsignalthrowifaborted：协作信号检查，不是强制中断异步函数。
