# 08 Pi固定源码核对

提交：8efd314fa3d3232ce197d8d7a6a5660530b9d83e。
设计前读取本地/tmp/ai03-pi/agent-loop.ts：AgentEventSink定义Promise<void>|void；agentLoop创建EventStream并用sink推送；runAgentLoop在runLoop前agent_start/turn_start；runLoop在模型返回后更新记录、工具反馈另行保存；executeToolCallsSequential先tool_execution_start，再准备与执行，之后emitToolExecutionEnd/createToolResultMessage/emitToolResultMessage。事件发送不是历史保存的自动替代。

第一方远程核对：
- https://raw.githubusercontent.com/badlogic/pi-mono/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/agent/src/types.ts ：AgentEvent与工具执行模式定义；Pi含增量、turn与并发能力，课程不据同类名称声称等价。
- https://nodejs.org/api/crypto.html#cryptorandomuuidoptions ：randomUUID用于生成一次运行身份；Node>=22已有此API，不引入UUID依赖。

本项目独立选择：单次onEvent回调而非EventStream；无正文/参数的原始值摘要、冻结事件；runId/sequence；观察异常隔离+observerErrors。顺序await不保证慢消费者隔离，既不是取消/审批hook也不是持久化通道。RunOutcome/finish是本项目为统一停止通知的组织方式。

没有通过Pi未读Agent类推断订阅行为：所尝试的本地agent.ts路径不存在，未据此作事实陈述。正文引用已读agent-loop调用链。
