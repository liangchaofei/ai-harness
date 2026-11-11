# 17：独立Coding CLI实施计划

阶段三/JD：终端应用接入既有模型、Runtime、代码工具；任务配置、进程控制、凭据归属、交付证据。沿用16机制，不围绕一次callLimit扩写提示词。

选择：apps/coding-cli独立私有workspace，bin构建入口；可信JSON配置选择来源、任务、允许写文件、外置验收脚本。CLI不导入examples，Runtime不认识终端。其他方案：继续给examples选择器加选项不产生独立应用；提前建通用harness包缺少第二应用的组合需求，本章不做。

范围：一次非交互运行、独立小型无依赖ESM材料、固定Node+tsx验收、沿用6模型/8工具/60秒，计划默认关。非任意仓库/任意shell/OS沙箱/恢复/TUI/自动合入。操作员选择的可信配置授权本地脚本执行，禁止模型选择命令。

执行顺序：
- [x] 核对固定Pi CLI→main→runPrintMode调用链与npm bin规则。
- [x] 候选增加apps/coding-cli：config参数/任务、types、session准备/运行、model、report接受/显示、main与bin；根只增build末项、apps类型范围。
- [x] fixtures/code-tasks提供两份配置、两份完整验收；examples/cli-observe仅注入固定模型，实际复用CLI主入口。
- [x] 临时工程类型/构建、help/坏参数/坏配置/双任务实际I/O/验收失败/旧证据/计划/取消/监听清理/外部bin消费验证。
- [x] 正文开头按实际过程分层编号；每份代码前说明功能与输入输出，之后追踪同一次数据。绘图并实际渲染。
- [x] 同步导航、路线、JD、系统图、学习/复习记录；网站构建，桌面和手机检查，保护学习源码哈希。

证据：固定模型/HTTP只证明接线，真实服务和自主修复质量另验。16用户真实尾部为callLimit/计划revision0/无修改/未验收，不能据此声称16任务完成；缺少前五轮完整轨迹。当前分支agent/chapter-16-task-plan干净，已含16源码；不切分支、不提交推送，不改学习源码。
