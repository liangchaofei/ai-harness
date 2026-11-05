# 08 运行事件与实时进度

本篇用途：不等runAgent返回，应用在动作边界就能显示进度；历史与执行选择仍属于Runtime。属于阶段二可观察内核，不是新增业务任务。

沿一次读取重建：run_start → model_start(1) → 完整消息写入 → model_end → tool_start(read_1) → 参数检查与读取 → 本批results存入 → tool_end → 循环写历史 → model_start(2) → model_end → run_end → const result接最终结果。

ID：runId归一次运行，sequence排序本次通知，modelCall标模型调用序号，toolCallId关联原请求。都不自动创建落盘/幂等/恢复。

观察与事实：事件摘要不给模型；ToolResultMessage由循环保存后才进入下一次Context。tool_start在门禁前，tool_end也可isError:true；未知异常tool_failed并停。观察函数被await，拒绝被计数，慢/不返回仍影响推进，不能当审批。

定位：派发器看event/observerErrors；循环看messages写入；执行器看value/execute/results。迁移改变path为123，应反馈结构失败且不命中execute。显示异常不重做I/O。

当前证据：作者临时固定响应与真实I/O验证；用户尚无08独立表现。无自主模型质量或岗位资格结论。

阅读入口新增：实施前的五步逻辑先辨主线结果反馈与通知支线，再对照八事件。应用侧terminal只排版，printEvent解释事件，printRun展示最终记录；它们不是Runtime状态持有者，日志布局也不改变协议或执行次数。
