# 10 作者验证记录

2026-11-05。开始时实际分支agent/chapter-09-model-streaming跟踪远程且干净，源码含09。未切分支、暂存、提交、推送或部署；10分支由学习者创建。没有读取真实.env或调用付费模型。

## 临时工程与类型

候选：site/snippets/10-run-cancellation，91个累计文件；相对09新增内部取消类、应用SIGINT连接和两个本地观察文件。继承教材变化标签已清除，正文片段/章末完整文件均同源。

临时目录：/var/folders/7s/3jb1m_s92z1cr54b6s_b76mc0000gn/T/ai10-cancel-v53ya65t；指针/tmp/ai10-temp。复制候选与本地依赖、重建三个包的workspace链接，没有使用真实.env。

最终npm run check退出0，三个包ESM/DTS构建及根tsc通过。单参数旧ModelCall、原预览第二参数、第三signal与工具可选第二signal均能消费；公开入口名称保留。

## 取消机制与正常/失败回归

- verify-cancel.mjs（源/tmp/ai10-verify.mjs）输出CANCELLATION CHECKS 97。覆盖提前取消、run_start/model_start/model_end/preview期间取消；真实调用计数；协作模型/迟到模型；协作工具/迟到工具；取消前结果保留；tool_start与tool_end门禁；已知失败继续/未知异常停止；旧answered/truncated/emptyAnswer/callLimit；两协议complete/stream提前取消零fetch、迟到Response取消body；AbortError名字不充当取消依据；观察失败隔离、run_end后不改停止原因。
- /tmp/ai10-integration.py最终退出0：正文6条取消/正常命令、早期模型零请求命令；两个任务×两协议4条真实应用入口（固定SSE+真实材料I/O）；两个实际入口SIGINT触发后退出码130，清理后新增SIGINT监听数0，无tool_start。
- 正文可逆故障：只丢shared/stream-model的signal，固定HTTP等尾段而不打印取消清理，Runtime仍拒绝迟到消息。恢复原接线。小迁移：在read_1的tool_end取消，第一结果保存，没有wait_2开始或tool_cancelled，没有第三项，读取1次。临时文件均恢复。
- 09流读取回归106项通过（UTF8/帧/工具拼接/中断/错误），08事件回归166项通过。旧检查直接导入源码readSse而从构建包取ModelCallError时属于不同类实例；作者脚本将这项instanceof对应到源码类，使用tsx加载源码；没有更改生产错误类型或放宽行为断言。

初始本地Anthropic固定帧存在多余右括号导致protocol失败，修正装置后两协议取消与正常对照通过；不是修改解码器吞坏数据。

## 原生本地HTTP取消

verify-native.mjs（源/tmp/ai10-native.mjs）输出NATIVE CHECKS 30。127.0.0.1临时HTTP服务，DeepSeek/Anthropic各验证响应头等待、SSE响应体读取、非流式JSON响应体读取中的取消。真实Node fetch消费组合信号，Runtime返回cancelled、只保留初始消息，观察model_cancelled，服务响应close；finally关闭server/连接与计时器。服务字段为本地预写，不请求外部。

## 仓库外包消费

/tmp/ai10-consumer.py将三个临时npm pack产物离线安装到独立目录，公开入口运行真实外部sample.ts读取，在tool_end取消后保留结果并停止；模型两协议complete/stream预取消均零fetch。公开CompleteOptions.signal、ModelCall第三参数、ExecutableTool第二参数、RunResult.cancelled类型消费通过。

外部目录：/var/folders/7s/3jb1m_s92z1cr54b6s_b76mc0000gn/T/ai10-consumer-0ha5yf1f；指针/tmp/ai10-consumer。没有发布npm。

## 网站、文案与源码保护

npm run docs:build退出0，仅已有大chunk提示。SSE/.env.example完整文件标为text，消除错误语言高亮提示。Waza中文标点检查通过；人工按正常轨迹、取消时机、调用方/返回/保存的关系审读。

本地4174服务原已运行，HTTP200，无需重启。实际浏览器检查10标题、侧栏、13个二级章节、98折叠项、3图加载、base路径，无#region。三张SVG均整图渲染检查：取消所有权、批次门禁、三条固定轨迹；中文、箭头、裁切可读。

/tmp/ai10-before.json保护的90份学习源码/材料/根配置SHA256核对未变；没有新增学习代码。91份候选均在章末同源引用，本地静态TS导入可解析，git diff --check通过。助手改动仅AGENTS、site和docs；Git仍在09分支。

## 证据范围

上述为作者机制验证；没有学习者10独立实现、迁移、延迟复用或真实模型自主任务质量证据。取消不能强杀不协作操作、回滚副作用或修复不完整协议历史；观察函数永不返回也会阻塞；停止原因已选定后的故障/终止通知不回改状态。HTTP30秒、调用上限、整次期限分开，11才实现后者。真实第二服务、生产隔离、恢复和完整评估仍待后续。

正文定位修订：第六步原来只说“两个已有入口”，第一份展开代码没有可见文件名。已在两份代码前分别明确完整替换examples/code-review/src/main.ts与examples/release-impact/src/main.ts，第二份折叠标题标修改。复核其余实现步骤都有就近路径；代码、候选与学习源码未改。
