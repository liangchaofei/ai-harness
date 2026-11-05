# 11 整次时限与运行预算：复习卡

新增行为：同一运行有累计期限和工具处理额度，返回timedOut/toolLimit；已有模型调用上限与主动取消保留。

责任：应用选择timeoutMs/maxModelCalls/maxToolCalls；Runtime循环持有历史和两种计数；control持有始点/timer/外部监听/内部signal；模型与工具协作退出。计数回调toolCalls+=1才更新总计数，返回值不自动保存。

轨迹：tools模式三项读取、额度2，只处理read_1/read_2；ToolBatchLimit.completedResults带回2条，循环push，toolLimit/模型1/工具2/实际读取2。normal恰好用满3项仍允许第二次模型文本；time先读后第二次等待到期，已有记录保留。

边界：toolCalls是尝试数，含未知名/坏参数/通知后取消，不等于I/O；message.toolCalls是请求数组。整次期限不每轮重置，单HTTP30秒不等于整次。timer可能延迟，stopStatus检查经过时长；不能强杀，首个记录原因固定，最终展示不回改结果。

下一篇阶段联调使用新材料与组合故障，不把固定流程answered当自主任务质量。学习者掌握未知，等待独立迁移与延迟复用证据。
