# 05 复习卡：跨任务复用

任务：发布ID→发布记录中的服务ID→服务负责人和依赖→摘要。应用只提供发布任务和工具说明；预期服务证据清单留应用验收，不作为模型输入。

- model/runtime/coding-tools实现沿用04；runAgent/executeTools不增加发布分支。
- loadRecords启动时读取实际JSON并校验，createLookupTool把Map与说明组合；执行时按id查记录。isRecord只是示例内部的形状判断，具体字段仍分别检查。
- 工具请求ID（call.id/toolCallId）关联一次动作；结果JSON里的id表示业务记录。不能互换。
- 两个应用共用createModelCall/printRun；各自reportRun分别检查源码读取或发布/服务查询证据，answered不等于任务正确。
- 默认start仍代码审查；--example release-impact只在应用入口选择，Runtime不处理命令参数。start/debug/check不按章节新增别名。

阶段取证：保留真实运行记录，解释输入/执行/反馈/停止/接受边界；定位一次缺材料失败；换release-43只改材料与任务配置。作者固定响应、打包消费和提交均不能证明学习者已独立掌握。

下一次：第二阶段前以新任务追一项请求，重建谁创建、执行、保存和转换；隔一单元再检查一次。多提供商、事件、取消、时限、流式仍待第二阶段，不因本章工具接入而完成。
