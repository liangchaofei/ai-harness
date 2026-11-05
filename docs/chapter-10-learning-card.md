# 10 主动取消一次运行：复习卡

功能：应用可以停止运行；信号沿模型与工具传递，等待退出后拒绝迟到结果，不再推进循环。

责任：应用持有controller；Runtime持有messages/modelCalls；model合并HTTP信号；工具具体等待/清理；事件只观察。

具体轨迹：assistant请求read_1/wait_2/read_3；read_1完成，wait_2期间取消；只有read_1的结果进入历史，wait_2无反馈，read_3不开始；cancelled/1次模型/1次实际读取。

关键对象：signal是通知，不是状态保存；ToolBatchCancelled.completedResults是批内已完成事实；runAgent.messages.push才更新历史；finish产生停止结果。

失败边界：不响应信号且永不结束仍阻塞；取消不回滚；partial历史不可直接恢复；单次HTTP超时仍是模型等待失败；终止已选定不随run_end回调修改。

观察：model两协议预览后清理、无完整响应；tools协作退出；late迟到正常返回仍拒绝；no-cancel完整对照。固定响应不证明自主任务质量。

掌握：未知，作者机制验证与学习者独立迁移分别记录。下篇复用取消链学习整次期限与预算。
