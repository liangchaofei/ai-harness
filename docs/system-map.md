# 累计系统职责图

2026-11-09：实际学习源码已含11；12为已提供候选，学习者理解、迁移与延迟复用待取证。规划和实现、作者验证分别记录。

```text
应用目标 / systemPrompt / 初始messages / 工具 / 接入配置
  → 07：检查工具清单、复制schema、编译同步参数校验器
  → runAgent持有本次messages、modelCalls
  → callModel(Context)
      → model.complete（06：按provider分发；07：失败分类）
      → 请求编码 → HTTP → 响应解码 → 项目AssistantMessage
  → Runtime保存assistant
      → stop / length / 上限 / 异常：RunResult → 应用接受与语义检查
      → toolUse：executeToolBatch → 名称/JSON/schema检查 → 具体工具语义检查与执行
          → ToolResultMessage关联原ID
          → Runtime保存整批结果 → 下一次Context
```

model定义模型输入输出契约，适配器认识服务协议；Runtime创建并保存运行状态；coding-tools提供受限代码I/O；examples选择任务、工具、配置与接受条件；fixtures提供材料。核心不反向导入示例、材料或UI。

06本地协议观察：固定fetch响应替代网络；请求编码、解码、Runtime和文件读取都实际运行。预写请求与答案不证明自主任务能力；真实服务与学习者掌握分别记录。

后续：阶段二事件/流式/取消/预算；三代码修改与验证、CLI；四上下文与记忆；五持久化恢复；六权限/扩展/人工介入；七评估与编排；八包接口收敛与桌面。计划按任务需要引入，不把每任务写计划设为强制。

07已知工具失败保存为code/message文本的结果并继续；未知异常返回RunResult.failure及仅本地调试error。ToolBatchError带回已完成结果，Runtime保存后停止，不补造出错项成功记录，不执行剩余动作，也不把不完整批次直接当作可恢复历史。providers/shared只共用HTTP等待，协议编解码仍各自负责。

08观察支线（候选）：runAgent的开始/模型调用/停止位置，及executeToolBatch单项处理位置 → events.emit → 本次runId与递增sequence → onEvent → 应用打印/未来界面。只传摘要原始值，不传messages可写引用。tool_end先于整批回到循环的messages.push，不能当作已保存全批。最终finish发run_end后返回RunResult，附同一runId与observerErrors。观察异常不改变停止状态或触发重试；顺序await有慢监听阻塞边界。09才接模型增量。

09候选：应用ModelCall → model.stream → provider请求(stream:true) → HTTP响应头 → readSse字节/UTF8/行/帧 → 服务局部草稿。文字分片→共享stream-model→Runtime的model_text_delta→应用printEvent；完整终止→done.message→ModelCall返回→Runtime.messages.push→原工具门禁/执行/反馈。流失败没有done，预览不写历史、不执行草稿；截断只保留文本/length。非流式complete继续共用请求构造。新增职责不进入任务工具。

10候选控制支路：应用Ctrl+C/按钮 → controller.abort → runAgent.signal → ModelCall第三signal → shared/stream-model → model options.signal → provider HTTP合并信号；同一运行信号进入executeToolBatch第四参数→tool.execute第二参数→具体协作等待/有界文件读取。Runtime等待结束后门禁拒绝迟到结果；取消批次只带此前results，循环push后finish(cancelled)。model_cancelled/tool_cancelled是观察事件，无当前反馈就不补造；两入口finally移除SIGINT监听。无强杀/回滚/恢复，下一单元期限复用信号链。

11候选：runAgent校验配置→createRunControl→同文件内runLoop持有messages/modelCalls/toolCalls；control持有独立signal、起始单调时刻、一次timer、外部监听。模型/工具仍读该signal；stopStatus边界刷新，首个记录原因固定。工具执行内部options含notify/checkStop/tryStartToolCall；计数在循环回调toolCalls+=1，拒绝超额项前无tool_start，ToolBatchLimit带回此前结果，循环push后finish(toolLimit)。期限同样复用ToolBatchCancelled并由control区分timedOut/cancelled；finish前与外层finally重复安全清理。无token费用估算/强杀/恢复。

12应用组装：fixtures → createReviewTask/createReleaseTask → ExampleTask{input,report} → 原main或stage-check → 原runAgent。input只含目标/初始消息/工具；预算、模型连接、取消源由入口决定；report闭包保留应用材料要求，不接管历史。三个核心包语义沿11。固定fetch仅替网络，原生流编解码/校验/工具/保存/停止实际参与；最终预览不等于完整消息，answered不等于证据齐全，证据齐全不等于语义正确。包外main.mjs只导入三个公开入口，配置自身材料，复用反馈及取消。

13：应用root → coding-tools.createWorkspaceTools → openWorkspace的files映射/paths集合/read函数 → 三个工具共享。find仅查路径；search逐文件read当前内容返回命中及截断；read_file从同一索引取文件，复查路径、有界读取并附行号。上述都是工具事实来源，不保存Agent历史；原Runtime创建toolResult、按原ID保存并带入后续Context。准备信号与每次execute运行信号分别传入。readTextFile抽自原清单读取，默认r保持兼容，workspace用O_NOFOLLOW；旧任务和发布调查继续。

14：应用mkdtemp/cp→RepairSession{root,before,input}→createCodeTaskTools→共享Workspace{paths,resolve,read,extensions,root}。replace_text检查写清单、唯一oldText、16KiB，临时文件→复读→rename；run_check固定spawn/无shell/env空/cwd副本→管道和限制→close→CheckResult。非零退出是正常工具观察（isError false/status failed），Runtime保存关联ID反馈再请求模型。原循环/提供商不改。运行signal到直接子进程，取消不伪造当前结果也不撤销已完成写入。report读取after并展示历史check，保留副本，未做最终版本绑定。

## 15：实际变更与对应验收进入任务接受

应用createRepairSession→coding-tools createCodeTaskSession；tools供Runtime顺序执行，baseline/lastCheck由同会话私有持有。run_check：清旧证据→capture(before)→原runCheck→capture(after)→保存CheckEvidence→JSON反馈→Runtime消息→模型后续动作。停止后应用inspect→重新采集current/changes→acceptRepair。模型包/Runtime不认识内容标识与金额验收；业务规则仍在examples/fixtures。恢复/隔离/原子快照仍未实现。

## 16：显式计划是可选状态工具

应用createRepairSession(options.planning)→runtime.createPlanSession→tool加入input.tools/read留应用。模型提出update_plan→原schema门禁→计划parse/序号检查→current替换→JSON反馈→原执行器关联ID→原循环保存→下一轮Context。应用tool_end成功→read深拷贝→printPlan。原CodeTaskSession仍独占基线/lastCheck/inspect，acceptRepair不读计划。

本次未改runAgent、执行器、事件类型或model/coding-tools；计划不调度工具、不新增harness空包。计划revision与源码revision异义，前者更新序号，后者内容摘要。false-complete可answered但不接受；固定开销对照不证明模型质量。

17候选：bin(cli.ts)→runCli→parseArgs→loadTask→createModelCall→prepareSession→runSession→原runAgent→reportSession/inspect→acceptTask→退出码。CLI只依赖三个公开包；examples/cli-observe反向导入应用并注入固定模型。fixtures/code-tasks保存四字段配置与外置验收。参数不合法/帮助不调用模型；SIGINT由CLI控制器转换，finally释放监听。原Runtime/工具状态与协议保持，独立目录非系统隔离。

18阶段复用：新的route.json→原loadTask/prepareSession/runSession→原model/runtime/coding-tools。reportSession读取result.messages展示assistant请求及按ID的toolResult，再inspect当前证据→原acceptTask。新业务验收从副本公开入口执行八项规则；core无route/cart分支。examples/stage-delivery只注入固定模型，不进入真实CLI。历史展示不是持久化、恢复或自动回放。

2026-11-11第18篇重写：正文改为“第三阶段实践验收”，以现有CLI接入新材料、审阅请求反馈与当前验收、保存结果为主；固定响应演示移至可选附录，不要求跟写，不重复175份继承文件。候选行为与实际学习源码不改。真实服务未执行、学习者独立迁移与掌握仍待取证，不以固定演示或本次文案改写提升状态。

2026-11-11真实诊断更新：用户授权实际运行与预算修订。原6模型/12工具/1024输出配置一次6模型/8工具接受；调整为8模型/12工具/60秒后一次5模型/9工具接受，八项验收通过。用户callLimit尾部表明第6次验收被末轮拦，固定同轨迹6轮拒绝/8轮第7次回答接受已验证；原程序计数和拒绝符合规则，改的是应用预算余量。真实成功不替代学习者独立迁移证据，旧“作者未运行真实服务”状态由本条更新。下一次复习区分toolLimit、callLimit、输出length和当前证据匹配；不自动开始19。

2026-11-11：19新增链路：runLoop持有完整messages→prepareModelInput复制→应用可选prepareMessages→返回消息再复制→callModel(context)。响应与真实工具结果仍只由原循环追加。初始消息也按当前结构复制。input_prepared只含条数与拟调用序号，CLI显示不接管状态；input失败模型次数不增。未实现裁剪/摘要/持久化。

2026-11-11：20：CLI 参数 → runSession → prepareMessages → selectInput；只选择发送消息，Runtime 完整历史与验收继续独立。

2026-11-11：21 应用层从历史中提取验收摘要，写入本轮输入；验收与原历史继续独立。

第 22 篇候选：任务配置 → 外部记忆文件 → CLI 按主题选一条记录 → prepareMessages 临时注入；当前验收和运行历史保持各自来源。

第 23 篇候选：CLI 准备一次会话，首段 Runtime 返回完整历史，CLI 追加一条用户追问后开启第二段运行。裁剪保留追问，报告复用当前会话验收。

第 24 篇候选：inspect → acceptTask → saveAcceptedMemory → 按主题维护笔记 → 下次 loadTaskMemory。记忆写入状态独立于当前交付。

第 25 篇候选：CLI 在运行段返回后将停止状态及新增消息追加到本地 JSONL。

第 26 篇候选：CLI 读取完整会话段 → 拼回历史 → 追加追问 → Runtime 单次无工具调用。工作副本及执行状态不参与恢复。

第 27 篇候选在 CLI 加入待验收检查点。恢复入口复用原工具接线并校验内容，独占标记防止重复尝试。

第 28 篇候选：检查点核对 → 独占标记或读取回执 → 执行验收 → 写入完成回执。

第 29 篇在示例层注入真实中断。实验入口、恢复 CLI、验收子进程分别留下启动、占用与结果线索，恢复门槛继续沿用正式回执。

第 30 篇候选：--inspect-check 与 --resume-check 共用任务及副本校验和回执分类，诊断分支在模型启动前返回。

第 31 篇候选：CLI 传递只读选项，在注册工具前保留调查执行函数，把其余执行函数替换为拒绝反馈。

第 32 篇让 Coding CLI 在工具执行函数外等待终端批准。参数校验和带原请求 ID 的反馈仍由 Runtime 处理。

第 33 篇在 CLI 检查点上持久化跨进程人工决定。准备段的工具装配移除 run_check，独立恢复入口在验收占用前核对决定。

第 34 篇由任务配置选择源文件对照工具，CLI 向它注入当前副本的既有读取能力，再将扩展与既有工具交给 Runtime。

第 35 篇由 Coding CLI 负责 MCP 子进程生命周期，并将已确认的规则查询包装为 Runtime 工具。模型工具请求 ID 由 Runtime 管理，MCP 协议请求 ID 由客户端管理。

第 36 篇在应用层装配验收命令，工具权限仍由 CLI 策略处理；启动后由 macOS 策略限制验收子进程的文件写入和网络。检查点恢复先校验执行策略。

第 37 篇在 Coding CLI 观察层将 Runtime 事件投影成 JSONL，保留 runId、sequence 与工具调用 ID。原会话日志和实际交付规则各自沿用。

第 38 篇在 Coding CLI 装配之前分流轨迹文件诊断；文件和 Runtime 的报告各自提供有限证据，离线入口不会重跑任何模型或工具。

第 39 篇的批次运行器逐项复用 Coding CLI，以退出码判定接受状态，以结构化轨迹记录 Runtime 计数和停止。批次报告保存在单独的新目录。

第 40 篇在 CLI 装配之前分流两份评估报告比较。交付变化由既有 outcome 分类，轨迹计数和耗时单独比较。

第 41 篇给应用增加一个委派工具，内部启动同 Runtime 的子运行。子工具表只含当前副本的 read_file，有限摘要作为父工具反馈返回。

第 42 篇从实际子 RunResult 收集有限摘要，随父 run_end 一起写入版本 1 轨迹。旧轨迹缺省字段时，离线检查只确认父计数。

第 43 篇在委派工具内部增加有界 worker，父 Runtime 的外层工具顺序保留。离线读取支持一批子运行并核对子 ID 唯一。
