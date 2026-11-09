# 13作者验证记录

2026-11-09，在临时workspace复制候选验证；学习源码、材料与根配置110份保护哈希未变。实际分支仍agent/chapter-12-stage-integration跟踪同名远程。未切分支、暂存、提交、推送、合并或部署；未读取真实.env、未输出凭据、未调用付费模型。

## 候选与真实文件行为

npm run check通过：三个包ESM/DTS构建、工程TS检查。作者50项断言通过，使用公开包入口与临时真实文件：

- 三工具与排序路径发现，普通TS范围，隐藏/非TS/依赖/dist排除，启动时链接文件及目录排除。
- 大小写敏感的查找与内容搜索、真实行号、无命中、全文编号。
- 字符串字段类型/额外字段/空白/长度拒绝，索引外相对/绝对/路径别名拒绝，Runtime原ID成功与失败反馈分别保存。
- 既有文件内容更新可见、新文件不自动入索引、重新创建后可见。
- 准备后文件或祖先替换为链接被复查拒绝；旧清单工具的默认r及原输出兼容，不把新工作区范围静默套给旧API。
- 16KiB恰好成功、多1字节拒绝，搜索读取失败不伪装无命中。
- find/search超过20截断、恰好20不截断、单行预览240字符与lineTruncated。
- 超64TS/256目录项/六层准备拒绝，相对root拒绝；准备与执行前取消拒绝（包括空工作区搜索）；tool_end取消保留此前真实反馈。

model/runtime共47份src与12做AST比较无语义变化。本次只有coding-tools抽取共享有界读/新增workspace能力，选择器增加入口；未复制循环。快照124文件、正文同源引用，变化标签相对12。

## 实际入口与集成

- 新无Key入口normal：answered/model4/tool5/接受true；recover：坏路径先反馈，再按预写计划继续，answered/model5/tool6/接受true。
- 缺规则材料：临时改为.bak后不进入索引，真实读取失败、应用缺证据拒绝，接受false、退出1；恢复成功。固定答案未随材料推导，不能当自主失败恢复证据。
- 通过examples/run选择workspace-review，DeepSeek/Anthropic两种固定原生SSE均跑完原模型包/Runtime/真实工作区，正常回答与反馈接线通过；没有访问服务网络。
- 原code-review/release-impact×两协议四组回归通过。
- 12阶段双任务×双协议×normal/recover/cancel十二组回归通过，覆盖共享读取抽出后的流式、反馈与停止接线。
- 正文早期build/公开createWorkspaceTools/直接执行三个工具命令逐字通过；此命令没有Agent或服务调用。

固定ModelCall只验证决策接口与真实工具链，不经过HTTP；两协议入口检查另用固定原生SSE。两者都不是实际服务质量或模型自主任务能力。

## 仓库外消费

三个包npm pack，离线安装至仓库外新目录；只从公开包名导入createWorkspaceTools/runAgent，配置使用者自己的project，实际读取进入第二次固定调用并answered。新WorkspaceOptions/createWorkspaceTools公开声明在外部严格tsc通过。没有内部路径导入、没有公开发布。

## 网站与正文

VitePress构建通过；保留现有chunk大小和旧示例语言回退提示，没有构建失败。实际Chromium检查正文、第三阶段链接、四张SVG加载、125个折叠区及源码展开、390px窄屏无整页溢出、无页面JS异常；图中文字和箭头检查无裁切。Waza标点检查通过，另审读术语/调用者/保存位置/具体值与文件操作指向。根start/debug/check不改，提供用户自行执行的中文heredoc提交及匹配push命令。

## 不能由此推出

未验证真实模型自主调查/质量或学习者独立迁移；没有第二家Key不构成进度阻塞。不具备完整仓库/OS隔离、并发恶意替换抵御、源码不可变快照、写入/验证/恢复或完整引用语义评估。64/20/16KiB及6/8/60s是有限范围策略，不是岗位达标或最佳配置。14必须继续实质代码动作和验证反馈。

临时作者证据：/tmp/ai13-check.txt、/tmp/ai13-results.json、/tmp/ai13-entry-deepseek.txt、/tmp/ai13-entry-anthropic.txt、/tmp/ai13-early.txt；临时文件可能被系统清理，本记录只记本次已观察结果。

2026-11-09正文补充：根据实际printEvent/printRun/reportRun和workspace-main分支，补齐真实服务实时日志、停止后记录、证据/语义核对及未交付定位。明确真实调用次数不固定、报告重放不是重复执行，timedOut/toolLimit/cancelled跳过普通报告，真实入口没有本地装置taskAccepted摘要。仅改正文与本记录，未改学习代码、候选或命令，未调用真实模型；既有学习者未提交改动保留。
