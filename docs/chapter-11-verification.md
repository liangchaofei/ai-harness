# 11 作者验证记录

2026-11-05。开始时实际分支agent/chapter-10-run-cancellation跟踪远程，工作区干净；学习源码已有10取消主链，部分本地演示未创建不作为核心遗漏。助手未切分支、提交、推送、合并或部署，未读真实.env、未调用付费模型。

## 候选和临时工程

site/snippets/11-run-budgets保存97份累计候选文件。只在候选增加Runtime控制/批次配置/额度异常、修改循环与展示、接入两个任务及本地观察。模型包与coding-tools机制保持10，仅清除继承变化标签；根脚本/依赖保持不变。

临时目录：/var/folders/7s/3jb1m_s92z1cr54b6s_b76mc0000gn/T/ai11-budget-m06ciwvg，指针/tmp/ai11-temp。复制候选与本地依赖，三个workspace链接指向临时包，不使用真实.env。最终npm run check退出0，三个包ESM/DTS及根tsc均通过。

## 正常、限制与失败

verify-budgets.mjs（源/tmp/ai11-verify.mjs）输出BUDGET CHECKS 118：
- 非法timeoutMs/maxToolCalls拒绝且零模型调用；0工具额度仍能文本回答。
- 逐项/跨轮累计、exact-cap后仍能生成最终文本、额度不足无tool_start/无I/O、部分结果保存。
- 未知名、坏JSON、schema拒绝计一次尝试；tool_start观察取消也计尝试，不等于I/O。
- 最后模型callLimit原规则与toolLimit顺序；协作/不协作工具超时；前一项保留，当前及后续不补造。
- 整次期限不按轮重置；模型/工具同步阻塞导致timer未运行时，返回或抛错处刷新期限，拒绝迟到文本/错误。
- 中间观察时间计入，run_end展示时间不改已选停止状态。
- 首个记录原因固定；内部超时不取消外部controller；dispose重复安全；答案/模型失败/工具失败/额度/预取消均移除监听并清理控制。
- 单请求等待失败仍failed/model_transport，不按异常名伪装为整次timedOut；executeTools公开签名兼容。

/tmp/ai11-integration.py最终退出0：
- 正文time/tools/calls/normal/cancel/late六条命令，状态、计数、真实读取次数符合表格。
- 10取消回归99项通过；信号现在由Runtime创建，原外部signal身份断言改为“不同对象但同类、实际取消仍传递”，其他行为保留。
- 09流机制106项与08事件166项回归通过。直接源码readSse与构建包错误类的instanceof仍按10作者脚本区分来源，没有改生产实现吞异常。
- 两任务×两协议4条实际入口固定SSE+真实材料I/O通过，answered及工具处理1/3项符合记录。
- 两实际入口临时缩短期限并注入本地等待，均timedOut、退出码1、等待资源清理，SIGINT新增监听数归0；修改均恢复。
- 可逆故障：删除control.stopStatus单调时间补查，同步阻塞后出现undefined/false；恢复后timedOut/true。
- 跨批小迁移：固定模型两批各两项，cap3；第二批第二项不开始，toolLimit/模型2/工具3/真实读取3，三条结果保留；装置恢复。

正文第一步早期命令单独执行，输出timedOut/运行信号true/应用信号false。所有模型动作均预写，不能作为自主任务质量证据。

## 原生本地HTTP

verify-native-deadline.mjs输出NATIVE DEADLINE CHECKS 30。127.0.0.1临时HTTP服务，两家协议分别在响应头等待、SSE体读取、非流式JSON读取中由整次timeoutMs触发。真实Node fetch接组合信号，返回timedOut，当前模型消息未保存、外部controller未被反向取消；服务端响应关闭。所有server/连接/计时器finally清理，无外部付费请求。不是通过等待30秒来伪造单次请求超时。

## 仓库外消费

/tmp/ai11-consumer.py将三个npm pack产物离线安装于独立临时目录，公开入口消费新选项/停止类型，真实外部sample.ts读取后取消保留；模型提前取消零fetch继续可用。另运行limits.mjs验证包外toolLimit零处理、timedOut无当前消息。公开TypeScript消费通过。

外部目录：/var/folders/7s/3jb1m_s92z1cr54b6s_b76mc0000gn/T/ai11-consumer-qlf4tr22，指针/tmp/ai11-consumer。没有发布npm。

## 网站与源码保护

npm run docs:build退出0，只有已有大chunk提示；Waza中文标点检查通过，人工核对期限范围、计量、停止来源与返回/保存。实际浏览器检查11标题、侧栏、12个二级章节、102折叠项、3图与base加载，无#region。三张SVG整图渲染检查，系统图signal标签初次重叠已移除并复查；控制图注明正常完成也清理，具体轨迹区分累计时间与额度。

本地4174服务已运行，HTTP200，未部署。/tmp/ai11-before.json中的92份学习源码/材料/根配置SHA256未变；97份候选均有同源完整引用，本地TS导入均解析，git diff --check通过。Git仍在10分支，所有助手改动仅AGENTS/site/docs。

## 尚未证明

未取得学习者11独立实现、迁移、延迟复用或真实模型任务质量证据。60秒/8项只是初始任务策略，未评估为通用最优默认值；12做新材料联调。取消/期限为协作控制，无硬抢占/回滚/恢复/OS隔离；工具尝试不等于token、费用或服务端停算。配置失败和已选定故障/停止的通知保留原结果，永不返回观察与操作仍可能阻塞。

## 阅读反馈修订：完整替换中的变化定位

用户指出 events 的完整代码难以辨认变化。第二步现按准确字段列明对照：run_end.status 追加两个值，run_end.toolCalls 新增；两个 cancelled 事件只改含义说明，结构不变。新状态分行并单独标新增，计数补来源注释。正文增加同一运行的两项通知示意，追踪 finish 填值、派发器补身份、onEvent 接收，以及类型声明不自动创建事件。

同时复核其他替换文件，补充 print-event、run-agent 与执行器的变化标签，并在 print-event 说明中列出三个变化的 switch 分支。五份候选的 TypeScript AST 结构一致，仅修改注释、排版和正文。初次 AST 比较误包含 SourceFile.text，修正节点取值后检查通过；未改机制或运行命令。

本轮学习者并行实施，前后比对发现实际 run-agent、print-run、print-event 已变化，不能声称工作区哈希全不变。助手编辑范围仅 site 教程/候选和本记录，没有写入学习源码，未还原学习者修改。
