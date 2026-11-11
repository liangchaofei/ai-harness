# 18来源核对

设计前重新读取Pi固定提交8efd314fa3d3232ce197d8d7a6a5660530b9d83e：

- packages/agent/src/agent-loop.ts：agentLoop/runAgentLoop复制与追加输入，runLoop持续模型/工具反馈。循环不按本课程的route/cart任务分支。
- packages/coding-agent/src/core/tools/edit.ts：editSchema声明精确原文和替换，createEditTool处理实际文件与修改；Pi还有多处替换、差异与排队等机制，本章不声称本项目单处替换等价。
- packages/coding-agent/src/modes/print-mode.ts：runPrintMode以session.prompt发送任务，订阅事件，读取最终状态，finally释放监听/运行资源；终端职责与通用循环分离。

https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/agent/src/agent-loop.ts
https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/coding-agent/src/core/tools/edit.ts
https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/coding-agent/src/modes/print-mode.ts

课程选择：通过新路径任务检验原CLI与包复用，当前内容匹配、固定外置验收、有限规则与预算保持。记录真实/固定证据来源，不把固定模型动作或有限用例说成自主能力/生产质量证据。不引入Pi全量接口、通用Shell或安全保证。
