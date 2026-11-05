# 11 固定源码与第一方核对

设计前读取Pi提交8efd314fa3d3232ce197d8d7a6a5660530b9d83e，packages/agent/src/agent-loop.ts的runLoop（242附近）、streamAssistantResponse（385附近）、executeToolCallsSequential（535附近）；本地/tmp/ai03-pi/agent-loop.ts并打开远程固定链接：https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/agent/src/agent-loop.ts 。

可支持的观察：循环持有context与新消息，模型转换与signal继续传入streamFunction；错误/aborted结束；工具按项处理，结果写入批次，每项结束后检查signal。未在这些函数中看到本课程的timeoutMs/maxToolCalls接口，不把课程预算设计写成Pi现有实现或行业统一标准；未审计Pi整个仓库不存在相关能力。

本项目选择：独立run-control持有期限与外部取消来源，首个记录的原因固定；Timer负责等待期间触发，performance.now边界检查补足回调延迟；Runtime持有modelCalls/toolCalls，工具批次申请额度；部分预算停止不补造剩余反馈。只借鉴责任与控制传递，不复制Pi完整恢复与状态策略。

2026-11-05打开Node第一方：
- https://nodejs.org/api/timers.html#settimeoutcallback-delay-args ：setTimeout不保证精确时间；delay超2147483647或小于1会设为1，非整数截断。本章拒绝范围外参数，不让大期限变成约1ms。
- https://nodejs.org/api/perf_hooks.html#performancenow ：performance.now提供相对进程起点的高精度经过时间，使用它计算本次duration而不是系统日期。
- signal原机制沿10已核对的Node AbortController/AbortSignal；本章model与coding-tools不改，复用现有协作链。

边界：定时器不是硬抢占；CPU阻塞/不协作工具/永不返回观察仍可能延后返回。stopStatus能在程序再次拿回执行权时拒绝迟到结果，不能保证在截止毫秒立即完成清理。工具处理预算不是成功数、token、费用或OS权限。
