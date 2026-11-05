# 10 主动取消一次运行：设计与实施计划

所属阶段：二，JD运行生命周期与可靠执行。前置09的流式预览/完整写入、08事件、07部分工具结果保留。当前检查09分支跟踪远程且干净，源码已有09；不切分支，10分支由学习者创建。

能力契约：应用持有AbortController，signal进入runAgent/ModelCall/模型HTTP与工具；取消后保留先前已完成记录，丢弃当前迟到结果，不再开始后续动作。RunResult.status=cancelled；取消不变成失败反馈、回答或恢复。终止原因在run_end前选定。

方案：采用协作取消并等待当前操作退出；不采用Promise.race伪装底层已经停止，也不强杀进程。忽略信号且永不返回的实现仍会阻塞，副作用不会回滚；这些是明确边界。普通接口选择由作者负责，沿用户已授权的阶段设计推进，不重复要求确认。

状态归属：应用创建controller与SIGINT监听；Runtime独占messages/modelCalls；模型包合并HTTP超时与外部信号；coding-tools在有界I/O间检查并finally关闭；观察支线只展示。模型第三参数signal保持第二预览回调；工具第二参数signal可选，旧函数兼容。

实施顺序：
1. 复制09候选、清除继承标签，保护学习源码哈希。
2. 模型signal及HTTP合并；提前取消的模型包观察先可运行。
3. Runtime契约、内部ToolBatchCancelled、执行器和循环的边界检查。
4. 文件工具协作清理、共享流连接；两个入口Ctrl+C与finally清理。
5. 无Key固定流/真实文件/协作工具与忽略信号的迟到工具观察。
6. 临时类型/正常/失败/取消回归、包外消费；正文、同源完整文件、三图、导航和内部记录；构建与网页实际检查。

机制保留：取消源与消费者分离、等待前后门禁、已有事实保留。暂定策略：取消优先于同边界异常/迟到返回，run_end固定后不改变；下一阶段联调再检查组合行为。范围：无超时扩展、无恢复/回滚/OS强杀，11处理整次期限。

Pi先读固定版本agent-loop的streamAssistantResponse和executeToolCallsSequential，signal传递和批后检查；本项目不复制其取消结果补齐或partial历史策略。第一方依据Node AbortController/AbortSignal.any、timers/promises取消。
