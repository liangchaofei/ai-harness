# 06 复习卡：模型适配

目标：换模型服务，保留同一Runtime与工具；一次新运行选定一个提供商，不等于运行中跨服务迁移。

- 应用createModelCall选provider与相应密钥/模型，闭包固定本次配置。model.complete检查后分发，Runtime不导入提供商。
- 项目ToolCall保留参数文本；Anthropic工具input是对象，解码JSON.stringify，发送历史JSON.parse。名称和ID复制，不重新分配。
- Runtime保存toolResult；Anthropic编码为user中的tool_result，连续结果合并，tool_use_id/is_error保留。DeepSeek编码为tool消息和tool_call_id。
- return返回项目消息，Runtime的messages.push才保存。编码器创建发送数组，不改变内部记录数量。
- end_turn/tool_use/max_tokens映射stop/toolUse/length。未知原因或块抛出→failed/model，不执行未返回的动作；answered仍需应用证据与语义检查。
- CompleteOptions.fetch是可信HTTP传输，不是ModelCall：固定样本只替网络等待，仍跑真实适配器/循环/文件读取；样本答案不是模型自主判断。
- 默认DeepSeek、start/debug/check不改；无第二Key运行check-protocol，不加载.env。真实第二服务、质量、成本尚待验证。

重建：画出一次toolu_read_01从样本/服务块→项目请求→本地读取→Runtime记录→第二次正文的路径。检查自己能否指出每个值由谁生成、谁复制、谁保存。

小迁移：改样本路径为不允许值，观察is_error和拒绝交付，再恢复；不要让预写答案替代读取证据。后续失败分类章节交错复习，隔一单元重新解释提供商边界。学习者独立表现仍待取证。
