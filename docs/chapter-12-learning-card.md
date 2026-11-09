# 12学习卡：阶段组合与任务证据

阶段二末，新增应用任务工厂与联调入口，三个核心包不变。目标/工具范围/report要求一起换，配置不等于执行。Runtime仍持有messages与计数；模型包认识协议，工具真实执行，入口持有取消来源与预算。

正常审查：两文件读取→结果关联ID入历史→第二次模型完整回答→有限证据检查→人工核对810/900。recover多坏参数一轮，toolCalls3而文件读2次，观察异常1次不改变停止。

断点：task返回、run-agent的messages.push、stream-model完整return、入口task.report。cutoff无tail→model_protocol；预览可见但无最终answer。改20%规则后固定计划仍说810/900，taskAccepted可true，真实数值640/800：证据齐全不等于语义正确。

包外公开入口：stream/runAgent/createReadFileTool，各自实际执行，使用者提供材料。Node包外消费不等于桌面或生产发布。迁移/真实模型轨迹/独立解释仍待收集；下阶段复用控制进入代码动作。
