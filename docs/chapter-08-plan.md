# 08 运行事件与实时进度：设计与实施

2026-11-04实际起点：agent/chapter-07-tool-contracts跟踪同名远程，工作区干净。实际源码已含07；分支或提交不代表学习者掌握。用户要求继续下一篇，按阶段二08推进；不再增加业务任务或展开更多失败类别。

能力契约：同一个runAgent运行中，应用能在模型等待前、完整响应后、单项工具处理前后和运行停止时收到有运行身份及顺序的摘要。模型/工具异常能对应失败事件，已知工具失败以tool_end/isError表达；应用展示不拥有messages。不实现流式文本、持久化、完整Tracing、授权或取消。

方案取舍：直接在核心console.log会绑定终端；通用全局事件总线/多订阅生命周期超出单次运行需要；本章采用每次调用可选onEvent回调、顺序await。回调抛错或拒绝只累计observerErrors，不改变Agent停止状态。慢回调会延迟执行，不返回的回调会阻塞；不能把此通道用于权限检查。默认只发原始值摘要，不发正文/参数/原始异常，冻结事件对象，不附运行状态引用。不是任意插件隔离。

Pi设计前核对：固定8efd314的agent-loop.ts runAgentLoop/runLoop/executeToolCallsSequential/AgentEventSink；先emit开始再等待操作，分别通知完整结果，事件与历史保存是不同语句。Pi本身用EventStream并有更多消息/流式/并发能力，本章不照搬。回调失败隔离与计数是本项目选择。

职责与文件：types/events.ts定义公共RunEvent/RunEventListener及包内payload；events/dispatcher.ts每次运行生成UUID、递增sequence、等待和隔离监听失败；tools/execute.ts内部executeToolBatch加可选通知，公开executeTools不变；run-agent.ts负责动作边界和所有正常停止经finish，写历史仍在原位置；types/run.ts拆包内RunOutcome与附身份/观察失败数的RunResult；index公开事件；examples/shared/print-event.ts展示；两main接onEvent；print-run显示最终运行身份；check-events.ts固定决策+真实读取，无网络。其余库与任务材料不变。

实施清单：
- [x] 核对起点、阶段与固定Pi调用链，确定上述能力及范围。
- [x] 完整候选由07复制并清除继承标签；只在当前变化处标注。
- [x] 临时构建与时序/失败行为：开始发生在等待前、批次逐项、部分失败、全部停止状态、监听失败隔离、无监听兼容、两运行身份分离。
- [x] 两任务/两协议固定HTTP接入与仓库外公开包消费。
- [x] 正文先走具体轨迹再小步骤接线，早期无网络检查；中文图解及页面实际渲染。
- [x] 导航、大纲、职责图、JD映射、学习/复习记录同步；源码/root配置哈希及diff检查。

验证：作者仅临时目录运行固定模型/HTTP和真实本地工具；不读真实.env，不调用付费服务，不覆盖packages/examples/fixtures；不切分支、提交推送部署。延迟与观察异常使用作者检查/可逆实验；不新增单测教学。普通实现选择由作者处理，既有授权无需重复确认。

## 2026-11-05 修订：整体逻辑与终端排版

用户要求实施前先了解整篇过程，并共用终端日志函数。保留Runtime全部代码与事件契约，仅修改候选examples展示：新增shared/terminal.ts的logLine/logBlock；printEvent按事件种类排成中文行，英文事件名/ID前缀/序号保留，完整ID见开始与停止；printRun将正文/工具请求/结果/停止/受控失败分块，check-events固定等待提示复用logLine。不引入依赖、彩色控制符或日志平台，不直接改学习者源码。正文五步说明主线与通知方向，沿用已验证位置图；分步操作和故障实验同步。
