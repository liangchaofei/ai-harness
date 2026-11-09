# 13学习卡：取得代码任务的证据

能力：应用只配root，模型能查路径、搜内容、读完整源码，在原Runtime中依新事实继续。Workspace持有路径范围和read，不持有messages；Runtime保存反馈，入口接result并调用report。

具体链：src/main.ts导出checkout/invoice，计算导入pricing/policy；legacy同名不在此链。find返回两候选，search定位discountRate三行，read保留完整源码和1起始行号。100×10连乘0.9两次得810，正确900。

边界：启动时paths固定、内容现读；隐藏/依赖/链接不入索引，64文件/256项/六层/路径240字符、每源16KiB，结果20条与行预览240字符。超限不返回半索引，失败不冒充无命中；不是OS沙箱/不可变快照/gitignore/通用仓库工具。

normal固定决策model4/tool5，recover多一次索引外请求model5/tool6；拒绝反馈不读外部路径。无Key观察不经过模型HTTP，不能当自主推理。断点在files.set、matches、workspace.read、Runtime.push、task.report。缺policy时fixed仍回答但材料证据拒绝。迁移只移动规则、更新材料导入与应用证据要求，通用包不改，真实模型另验。

下一篇：同一调查接入工作副本修改与真实验证反馈；只读索引不授予写权限。当前独立理解/迁移与延迟复用待证。
