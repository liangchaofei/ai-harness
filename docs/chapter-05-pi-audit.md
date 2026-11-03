# 05 Pi 对照与设计依据

2026-11-03设计前读取固定Pi提交8efd314fa3d3232ce197d8d7a6a5660530b9d83e的packages/agent/src/types.ts中AgentTool与agent-loop.ts中prepareToolCall。原文保留于/tmp/ai03-pi。

AgentTool将工具说明与execute结合；prepareToolCall按toolCall.name从注入工具清单查找并校验。它没有把read_file作为通用执行器的固定业务分支。04已经核对runLoop/streamFunction注入，本章复用该职责边界，不改本项目核心。

本项目createLookupTool、发布与服务的JSON材料、受控任务证据清单是课程自己的应用示例，不来自Pi；不是对Pi插件体系、schema引擎或企业发布系统的复刻。工厂只在当前示例复用，未新增框架包；模型连接与日志放examples/shared，具体任务接受规则仍留两个应用各自的report-run。

来源：
- https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/agent/src/types.ts
- https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/agent/src/agent-loop.ts

本章模型协议不变；沿用03/04已经核对的DeepSeek转换与调用，不添加提供商或新服务API，不自动调用付费服务。
