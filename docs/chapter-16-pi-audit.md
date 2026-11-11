# 16来源核对

设计前实际读取固定提交8efd314fa3d3232ce197d8d7a6a5660530b9d83e：

- packages/coding-agent/examples/extensions/plan-mode/index.ts：planModeExtension闭包中planModeEnabled/executionMode/todoItems，updateStatus展示，before_agent_start注入剩余步骤，turn_end根据DONE标记更新，persistState/会话恢复保存扩展状态。计划由扩展提供，不宣称Pi主循环必写计划。
- 同目录utils.ts：extractTodoItems从Plan段落提取编号，markCompletedSteps按标记完成；本章不复制文本提取或命令正则，不将它们当成系统沙箱。
- packages/agent/src/agent-loop.ts：runLoop执行工具并继续模型，计划扩展与运行推进职责分开。

https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/coding-agent/examples/extensions/plan-mode/index.ts
https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/coding-agent/examples/extensions/plan-mode/utils.ts
https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/agent/src/agent-loop.ts

课程选择：结构化update_plan、可选runtime能力工厂、模型声明不代替独立验收、计划更新号拒绝旧请求。没有从Pi推导相同API、提升模型效果或生产成熟性。schema复用已有Ajv；编译一次每会话的直接调用检查，原registry仍按运行编译门禁，非每轮重新编译。
