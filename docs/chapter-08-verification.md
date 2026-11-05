# 08 作者验证记录

2026-11-04。起点实际分支agent/chapter-07-tool-contracts跟踪同名远程，工作区干净。候选site/snippets/08-runtime-events；实际packages/examples/fixtures/root配置不改写。不执行分支、提交、推送、合并、部署，不读真实.env，无真实模型网络请求。

## 临时工程

/var/folders/7s/3jb1m_s92z1cr54b6s_b76mc0000gn/T/ai08-events-qlyb_h6h，指针/tmp/ai08-temp。从完整候选复制，临时root workspaces只去掉site；临时npm install --offline --ignore-scripts，已有缓存依赖，无新增依赖。npm run check构建三个包并检查所有示例，退出0。最终事件类型补充字段JSDoc/排版后再次check退出0。

## 运行机制

作者脚本verify-08.mjs（/tmp/ai08-verify.mjs副本）166条断言通过，不等于166种独立场景。主要证据：

- 模型Promise人为保持未完成时，已收到run_start/model_start，尚无model_end。
- 工具Promise未完成时已收到tool_start，第二项尚未处理；释放后按项start/end，整批后下次模型输入。
- 工具schema坏参数不进execute，有tool_end/isError:true，下一调用取得反馈；已知ToolExecutionError不停止后续正常处理。
- 第二项未知异常：第一项结果保留，第二项tool_failed，不发其tool_end，不处理第三项/不请求下一次模型；事件不含原始cause或工具正文。
- answered、truncated、emptyAnswer、callLimit、model_failed四种已知类别与未知模型异常、清单失败、批次协议失败都有单条终止通知。无效maxModelCalls仍在有效运行前抛错，无事件。
- 观察函数同步抛错和异步拒绝都计数，包含run_end失败；八条均失败时observerErrors为8，但实际动作只一次，仍answered。等待观察完成后再推进，非后台队列。
- 冻结事件防止改字段；只含原始值，不暴露历史引用。无监听兼容、两次及并行独立运行不同ID、每次顺序重置；公开executeTools仍可调用。

07原verify-07.mjs在08临时工程回归51项通过：schema/配置/ID/已知失败修正/未知部分批次、双模型协议与分类、调用上限等保持。观察计数不是工具失败分类，不实现自动重试或恢复。

## 实际入口与迁移

无网络check-events入口实跑：八条事件，sequence1–8，同runId；两次固定等待前先model_start；第二次输入3条消息；真实读取src/cart.ts，最终answered/2/observerErrors0。固定请求与最终文字预写，不是模型自主审查证据。

/tmp/ai08-integration.py：固定HTTP hook（/tmp/ai06-entry-hook.mjs）替代网络，实际examples/run.ts两任务×两协议均通过：code-review8条、release-impact14条；发布任务单项分别属于modelCall1/2/2，成功返回并经原任务接受。未声称线上账户、线上协议或语义质量通过。

按正文原样在临时源码做三项可逆实验并恢复：
1. printEvent在tool_end打印后throw，answered/2，观察失败1，读取一次。
2. check-events的path改数值123，invalid_arguments与tool_end/isError:true，固定answered不作为任务通过。
3. 移除onEvent，无实时事件行，仍answered/2、观察失败0。

## 仓库外消费

/tmp/ai08-consumer.py，将临时三个包npm pack到外部目录并离线安装：
/var/folders/7s/3jb1m_s92z1cr54b6s_b76mc0000gn/T/ai08-consumer-0vdz51dp。
两提供商固定HTTP、同一Runtime、外部sample.ts真实读取均通过；公开RunEvent/RunEventListener/RunResult类型消费编译通过。事件8条、runId对齐、工具原ID与观察失败0验证。未发布npm。

## 教材与页面

三个原生SVG：系统观察支线、派发器完整流程、八事件与历史写回轨迹。实际浏览器查看每张完整渲染：中文、框内换行、箭头、边界说明无裁切。页面标题/六步/导航、69折叠完整文件、3张图片base路径及加载成功，页面无#region。完整步骤与80处源码引用同源；正文关键摘录与候选源码逐段核对。

Waza中文标点检查通过，另人工审读正常链、失败与设计边界，非只按正则验收。网站构建通过，原有大chunk提示不作为失败；.env.example引用显式使用text语法避免错误的example高亮。没有真实.env内容。

/tmp/ai08-audit.py对起点68份学习源码/材料/root配置SHA256核对全部未变；model/coding-tools/fixtures候选除清理旧变化标签外保持07。所有69候选文件均有完整核对引用。git diff --check通过；Git分支未变。

## 证据边界

仅作者机制与本地I/O验证。没有08学习者运行/独立迁移/延迟复用证据，没有真实模型自主任务结果。顺序await观察，慢/不返回可阻塞；没有流式文本、事件持久化/重放、全链路Tracing、权限控制、取消、跨进程或生产隔离。RunResult失败记录仍可能有不完整批次，不可凭事件ID直接恢复。

## 2026-11-05 整体讲解与终端展示修订

本次起点实际分支agent/chapter-08-runtime-events；工作区含学习者尚未提交的08实现，保留全部改动。/tmp/ai08-log-baseline.json记录本次起点72份学习源码/材料/root配置哈希，结束核对全部未变；/tmp/ai08-log-core.json记录候选packages的41份文件，全部未变。没有将旧的干净07起点或旧68文件基线误用来覆盖本次用户改动。

改动仅正文、候选examples的展示和内部/项目教学约定。实施前增加五步因果过程，原系统位置图放到这段之后，八事件表继续对应同一读取。新增terminal.ts的logLine/logBlock，printEvent显示ID短前缀/序号/事件名/中文摘要，开始与最终结果保留完整ID；printRun将文字、请求和工具内容分块，停止块只选status/modelCalls/runId/observerErrors，失败块仍筛选异常标识。check-events等待提示接相同logLine。旧版本的密集JSON输出及故障实验替换为新格式，前文旧验证中的输出文字保留为历史证据，不当作当前显示模板。

Node22第一方util.inspect文档已核对：https://nodejs.org/download/release/latest-jod/docs/api/util.html 。仅借用内建显示能力，不引入日志依赖或把inspect输出当JSON协议。无色、无自动持久化/脱敏；正文说明当前小记录完整展示的边界。

临时工程：/var/folders/7s/3jb1m_s92z1cr54b6s_b76mc0000gn/T/ai08-terminal-8pdl73z4，指针/tmp/ai08-terminal-temp。复制候选并复用上一临时工程缓存依赖，临时去掉站点workspace；npm run check退出0。

作者check-log.mjs（/tmp/ai08-log-check.mjs）：36条断言通过。覆盖八事件分支及已知失败反馈；ID前缀/完整ID、序号；多行字符串/对象与循环引用排版；不调用自定义inspect和getter；打印受控模型失败不包含原始cause标记；无网络实际入口八事件且开始先于固定等待、第二次输入3条、源码保留实际换行；正文插入throw实验仍answered/2/observerErrors1且读取结果只有一份，随后恢复。

两个实际examples/run.ts入口以既有固定HTTP hook运行，真实本地读取/查询与原应用接受参与：code-review8事件、release-impact14事件，均answered、observerErrors0。无付费模型调用、无真实.env。由于核心与协议未改，不重复把既有作者全量检查计作本次新增证据，也未重新发布或打包库。

所有70份候选文件都有完整同源引用。Waza中文标点、git diff --check通过；网站build退出0，只有已有大chunk提示。实际浏览器检查新增实施前逻辑、终端工具代码和70折叠项；三图加载正常、位置图沿用既有实际渲染验证。恢复本地4174服务供阅读，未部署。学习者迁移/延迟复用与真实模型任务质量状态不变。
