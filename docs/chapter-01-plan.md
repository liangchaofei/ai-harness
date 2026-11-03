# 01：样章实施计划

起点main、无提交，只有workspace与站点，无packages/examples/fixtures学习代码。用户授权继续并查看01样章，不授权付费调用、Git写操作或代写学习源码。

能力：解释并实现应用通过模型包发送system/user消息、服务生成assistant文本、程序检查响应后返回给应用；从生成停止与任务成功的区别建立后续循环前置。monorepo必须实际通过dist公开入口消费，不跨包相对导入。正常程序不使用固定回应。

候选：单model入口保存类型、响应检查与一次fetch，不引入通用SDK层或额外校验框架；代码审查示例只提供代码文本，不读取或执行本地代码。JSON/字段检查当前单一调用处保留本地，不提前建shared。依赖与编译配置完整提供但折叠；主体分类型、decodeText、generateText、应用。两图显示系统位置与模型包分支/具体数据。

验证：独立临时workspace安装、check/build；固定fetch检查请求参数与正常/失败/截断/空响应/非JSON/缺配置；实际示例入口与构建包仓库外安装消费。无真实.env或付费模型。候选参数与服务当前文档核对，Pi只对照固定提交的Context职责。

## 2026-11-02源码核对后的当前设计

以上为初稿计划记录。当前候选分为index纯导出、types契约、validation包内判断、providers/deepseek适配与应用五份源码。Context与CompleteOptions分开，complete返回AssistantMessage并保留stop/length；示例决定截断或空文本不交付。包内分离后使用tsup打包ESM与d.ts，TypeScript锁5.9.3以支持打包器需要的编译器API。只借鉴已读取的Pi边界，暂不复制提供商集合和流式系统。
