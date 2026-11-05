# 11 整次时限与运行预算：设计和实施计划

阶段二第六单元；JD运行控制、有限执行、可靠性。10之后实际检查分支agent/chapter-10-run-cancellation跟踪远程、工作区干净，源码已含取消机制；缺少部分本地演示不作为核心遗漏。用户没有提供10独立迁移/真实运行证据，不因继续或提交推断掌握。分工授权不变。

能力契约：一次运行可配置timeoutMs与maxToolCalls，保留maxModelCalls；整次期限覆盖开始通知、工具准备、所有模型/工具等待和中间观察，停止原因选定后不计run_end展示时间。到期触发10的协作信号，保留已完成事实、拒绝迟到结果；工具处理预算逐项跨批累计，拒绝开始超额项，返回timedOut/toolLimit。无付费调用、无学习源码覆盖、无Git变更操作。

选择：每次运行创建control/run-control.ts，持有自己的controller、单调时钟起点、单次定时器与外部信号监听；首个记录的停止原因固定。边界主动刷新时间防止timer回调延迟；finally清理监听/计时器。不同于仅每轮看时间（不能中断等待），也不采用Promise.race假装任意工具已终止。timeoutMs可选，范围1..2147483647整数；maxToolCalls可选非负安全整数，省略保持原行为。

工具预算计量：Runtime持有toolCalls，进入一项处理前tryStartToolCall检查并加1；包括未知工具、坏JSON/schema与通知后被取消的尝试，不是实际I/O次数。到达上限只拒绝下一项，已经完整反馈后仍允许模型生成答案；最后一次模型仍请求工具时原callLimit优先且不执行。部分批次toolLimit带回已完成结果并终止，不直接再发模型。

文件：types/run-control.ts内部控制契约；control/run-control.ts生命周期；types/tool-batch.ts内部执行配置；errors/tool-batch-limit.ts带回已完成项；tools/execute.ts内部参数由四个位置改为options对象，公开executeTools保持10签名；run-agent接入控制/计数/新停止；types/run/events与应用打印、两入口配置同步。模型、coding-tools协议不修改，复用signal。

实施顺序：复制10候选清旧标签与90余源码哈希保护；先控制器小观察；执行预算与Runtime集成；两任务60秒/8项示例策略；无Key固定模型+真实读取的期限/工具预算/模型上限/正常/取消/晚返回观察；临时类型、失败/回归、原生本地HTTP及包外消费；正文同源代码、图、导航、Waza、网站构建与渲染。

Pi设计前固定核对8efd314fa3d3232ce197d8d7a6a5660530b9d83e的runLoop、streamAssistantResponse、executeToolCallsSequential：上下文与signal传递、批次和停止；不把本项目的timeoutMs/maxToolCalls宣称为Pi现有接口。第一方Node timers定时器范围/非精确时间与performance.now进程单调经过时长。无恢复/回滚/抢占/货币token预算；阶段12再做组合联调与任务质量取证。
