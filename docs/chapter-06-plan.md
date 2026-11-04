# 06 模型适配：换服务，保留同一个 Runtime

2026-11-04，实际分支 agent/chapter-05-runtime-reuse 跟踪同名远程。起点有三份未提交内部记录，保存用户05完整日志证据，不回滚。实际源码已实现05，助手不写学习源码，不切分支或提交推送。用户没有第二家 Key；保留 DeepSeek 默认接入，不要求购买，不调用付费服务。

所属阶段二，JD能力为多模型接入、协议隔离、工具往返与运行失败边界。新增能力：model公开complete按provider选择DeepSeek/Anthropic，服务消息差异留在model；两个任务、Runtime和工具不变。完成证据：临时真实公开包＋固定HTTP实现的双提供商双任务、原ID反馈、不同停止与失败分支；真实第二家服务待验证。

设计依据先读取Pi固定8efd314fa3d3232ce197d8d7a6a5660530b9d83e的Models.complete/stream、anthropicProvider、buildParams/convertMessages/convertTools/mapStopReason及DeepSeek provider。之后核对两家官方协议。Pi完整流式/认证注册不照搬，当前采用两个固定适配器分发；细节见pi-audit。

替代方案：只换兼容URL不足以验证不同消息协议；提前建设可注册模型目录/动态插件增加当前负担；采用两家明确分发与统一输出。Anthropic用官方Messages API 2026-10-21，Bearer鉴权；选择支持关闭思考的claude-haiku-5-5作为配置示例，不承诺所有Claude型号可直接替换。关闭思考不等于没有推理能力；当前公共消息不保存思考块，收到未知块明确失败，不丢弃。

职责：应用选provider、取对应密钥；complete共用参数检查后分发；各适配器编码/HTTP/解码；Runtime仍保存项目Message并执行工具；请求参数/headers不进消息。新CompleteOptions.fetch是可信应用注入的HTTP函数，仅用于无网络协议观察，不是Runtime模型替身接口，也不通过env自动启用。生产默认globalThis.fetch，注入函数会接触密钥，教程说明信任要求。

实现步骤：按职责类型与共用检查→DeepSeek迁至completeDeepSeek、保留协议→Anthropic输入编码与输出解码→请求适配→公共入口/公开导出→先构建检查公共调用→应用配置选择→完整固定JSON材料和本地观察入口→原命令及迁移、失败实验→完整文件/Git命令。

新文件连续多步逻辑配系统位置、服务往返/批次合并、本地观察流程图。正文正常轨迹使用同一toolu_read_01，说明服务字段/值来源、JSON字符串与对象转换、return/await/history.push。原始响应样本明确缩减结构，非抓包。fixed answer明确预写，不用成功审查日志证明自主能力。

限制：非流式文本＋用户自定义工具；三个停止映射；不支持图片、思考块、服务端工具、任意模型、运行中跨提供商恢复、自动重试/降级、完整用量成本。HTTP失败/未知协议抛出→既有failed/model；后续07专门失败类型与工具契约。原30秒每请求和maxModelCalls保留，后续控制专题演进。

验证：候选临时workspace安装/构建类型；48项适配及原循环路径检查、双任务双提供商4项真实入口检查；补做包外消费、正文命令、失败实验、网站构建及浏览器渲染。原packages/examples/fixtures/apps及根配置SHA256核对不变。正常DeepSeek真实任务由读者自行选择执行；没有Key只运行本地入口即可推进。
