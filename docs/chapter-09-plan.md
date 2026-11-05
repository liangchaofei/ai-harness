# 09 流式模型与完整消息

2026-11-05实际起点agent/chapter-08-runtime-events跟踪远程、工作区干净，实际源码已含08事件与终端排版；不据提交推断掌握。沿阶段二09，不新增业务任务。

能力契约：两原服务均请求原生SSE，应用在完整模型消息返回前显示文本片段；工具参数按服务索引拼接，只在结束信号和协议检查后产生完整AssistantMessage，Runtime保存一次后才可能执行工具。中断后已展示预览不升级为答案，不执行未提交请求。非流式complete保留；不教学单测、无付费请求。

选择：新增model.stream的异步生成器，产出text_delta和唯一done事件（携完整项目消息）；保留complete原接口，不用假拆字模拟线上流式。应用的ModelCall可选第二参数接收文本通知，createModelCall遍历stream并返回done.message；Runtime在08事件通道增加model_text_delta，仍只在callModel完成时保存消息。providers/deepseek和anthropic目录收纳各自已有入口、编解码及新增request/stream，删除旧根位置副本，更新相对导入而不改算法；共用请求构造避免两套payload漂移。

共享网络层：request-response处理HTTP/连接，request-json继续处理JSON；read-sse独立处理UTF8跨块、CR/LF/CRLF、空行、多data、注释、2Mi字符响应上限与reader清理。不是完整EventSource，不重连/id恢复。DeepSeek按tool_calls.index累积，finish_reason+[DONE]才done；Anthropic按块index/开始/增量/结束、stop_reason+message_stop才done。只支持现有文本与自定义工具，思考/服务工具等未知内容拒绝，截断不执行工具。

设计前固定Pi8efd314：读取agent-loop的streamAssistantResponse；Anthropic的iterateSseMessages/iterateAnthropicEvents及内容块拼接。Pi将partial写入内存后替换final，本项目选择不把预览存入历史；借鉴增量与最终结果分离和完整请求才执行，不照搬修复JSON或全事件体系。第一方DeepSeek流式/工具、Anthropic streaming、WHATWG SSE已读。

实施：
- [x] 候选从08复制、清除旧标签；类型/请求/SSE与两服务拼接。
- [x] Runtime/应用连接；早期模型流观察与完整Agent无网络观察，用原工具真实读取。
- [x] 临时构建、分片/工具门禁/失败/资源释放/原complete回归；两任务两协议与包外消费。
- [x] 实施前文字与图，分步/局部输入输出/完整文件，固定协议材料全量提供；断点/可逆中断/迁移。
- [x] 导航/阶段/系统/JD/学习记录；实际页面和图渲染、构建、学习源码哈希。

只写site/docs/AGENTS，不写packages/examples/fixtures/root配置；不切分支、提交推送部署，不读真实.env。正文保留start/debug/check与中文heredoc和push。没有第二Key不影响本地机制观察。慢观察、单请求30秒与整次取消/预算仍分别留08/10/11边界。

流中合法服务错误帧新增ModelFailureKind.service，并由Runtime原映射得到model_service；不把它误归为JSON协议损坏。固定SSE末尾保留注释行，确保网页复制时终止帧后的空行仍在文件中。
