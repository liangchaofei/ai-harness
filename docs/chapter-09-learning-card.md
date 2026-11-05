# 09 流式模型与完整消息

功能：生成中可预览文字，完整响应后才保存并决定工具执行。

完整链：createModelCall绑定配置→stream-model消费model.stream→请求stream:true→readSse恢复字节/文字/帧→提供商草稿。文字yield text_delta→onTextDelta→Runtime events.emit→printEvent。终止标记与停止原因检查→yield done→连接return消息→Runtime保存一次→原执行器/反馈/下一次模型。

三种小块：网络块可能截开UTF8；SSE空行结束帧；帧里可能只有工具参数片段。索引拼接不等于call ID，JSON可解析不等于请求已交付。

失败：缺终止=protocol，reader拒绝=transport；无done、不保存半条assistant。length不交付工具草稿。已展示文字仅预览，不自动撤回。观察失败只计observerErrors。

范围：两服务文本/自定义工具，2Mi字符、单HTTP30秒；无思考/图片/服务工具/重连/恢复/主动取消。旧complete保留。固定样本不是模型自主决定或质量证据。

迁移：同一arguments三帧→最终参数一致，仍一次read_1；断点看provider局部草稿、stream-model返回与Runtime.push。学习者独立表现待取证。
