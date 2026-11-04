# 07 作者验证记录

日期：2026-11-04。起点agent/chapter-06-model-providers跟踪同名远程且干净；学习源码已有06，但没有据提交推断真实第二服务成功或掌握。助手未切分支、暂存、提交、推送或部署，未读真实.env，未调用付费模型。

## 候选与临时工程

site/snippets/07-tool-contracts为完整候选。临时工程：/var/folders/7s/3jb1m_s92z1cr54b6s_b76mc0000gn/T/ai07-contract-vllslz02，指针/tmp/ai07-temp。依赖Ajv8.20.0安装到临时工程，Runtime清单固定版本，未改根学习工程依赖/锁。最终npm run check通过三个包的构建、声明生成与全工程tsc。

先读固定Pi的prepareToolCall与validateToolArguments，再选择课程实现；记录见chapter-07-pi-audit.md。没有把Pi的TypeBox实现称为Ajv，没有复制自动类型转换和原参数错误输出。

## 51项行为检查

临时verify-07.mjs通过51项检查，使用固定ModelCall/HTTP、实际公开包和真实I/O，不作为真实模型自主证据：

- 合法参数只执行一次；null/数组/缺必填/类型不符/额外字段均不执行工具。非法JSON、未知工具、已知语义失败分别有稳定反馈代码。
- 注册重名、非法或缺失名称、空/非字符串说明、缺execute、坏schema、非object根、未知关键字、异步schema和远程ref均为tool_configuration，模型调用数0；无工具任务仍有效。
- 不转换类型、不补默认、不移除额外字段；批次空/重复ID在任何工具动作之前拒绝。
- 已知失败反馈进入下一轮，正确参数执行后回答；调用者初始数组不追加。已知失败不阻止同批后续合法动作。
- 第一项真实写入临时effect.txt成功，第二项抛未知异常，第三项未调用：停止模型继续，first结果保存，故障ID关联second，文件效果仍在，验证没有回滚。原始secret-marker留在本地cause，不进入failure/默认打印。
- 非文本工具结果明确停止；schema为运行快照，调用方修改原schema不改变已准备规则，方法this保留。
- 两家服务正常响应回归；配置/HTTP429/连接异常/坏JSON/不识别消息/响应体中断分别分类，受控说明没有原始敏感异常正文，HTTP状态码可读。
- 两条原check-protocol无Key入口仍成功；未知ModelCall异常为model_unknown；最后调用上限和截断均不开始工具；新check-tool-contract为invalid_arguments反馈→实际读取→answered/3。

服务原始ID可能先被解码器拒绝，属于model_protocol；tool_protocol是执行器对项目批次的保护。正文明确两者依发现边界不同，不声称重复ID永远只出现一个类别。

## 原任务及包外消费

固定HTTP hook实际执行examples/run.ts：DeepSeek/Anthropic × code-review/release-impact四条路径均通过，使用原任务材料与接受规则，没有提供商业务分支。发布两项服务请求仍按顺序完整反馈，再回答。

三个包npm pack，在独立工程离线安装，目录：/var/folders/7s/3jb1m_s92z1cr54b6s_b76mc0000gn/T/ai07-consumer-zgc6agnq。两种提供商分别通过公开complete/runAgent/read_file读取该工程自己的sample.ts，两轮回答、原ID及第二次输入实际源码均正确；外部CompleteOptions/ModelProvider/ModelCall/RunFailure类型检查通过。Ajv是Runtime真实依赖，不依赖仓库外源码相对路径，没有发布npm。

## 正文观察与故障迁移

第一步heredoc在临时工程运行，输出transport与受控连接说明，无网络。check-tool-contract实际三轮；06两条HTTP协议观察仍两轮。

正文主要故障：在临时examples/code-review/src/tools.ts追加reviewTools.push(reviewTools[0]!)，得到tool_configuration/failed/0次模型调用；恢复原文件。也验证观察入口重复展开tools的等价方式。

小迁移：仅将第一轮123改为src/missing.ts，结构通过但清单拒绝，代码tool_failure；第二轮仍读取成功。恢复123后回到invalid_arguments、正常三轮。没有改学习工程材料或源码，没有把固定脚本称为模型自主修复。

## 网站与源码保护

npm run docs:build成功，保留已有大chunk提示，未因此改打包配置。Waza中文标点检查通过。84处同源引用均存在；67个折叠包含两个行内适配文件与完整快照。旧execute-tools.ts/tool-error.ts不在最终快照，无旧内部导入。

4174原服务可用，本章HTTP200。实际in-app browser核对标题、第二阶段侧栏、新完整文件折叠与三个SVG加载，无#region；打开tools/registry.ts折叠查看。三图分别全图截图检查文本、箭头、裁切和base路径：工具门禁、部分结果、独立失败分支。部分结果明确无回滚/恢复，不把失败记录当作完整可继续历史。导航/首页/阶段路线、学习记录/复习卡/系统图/JD覆盖同步。

学习目录packages/examples/fixtures/apps及根package.json/package-lock.json/tsconfig.json共57份文件前后SHA256和文件集合一致；没有代写学习源码。git diff --check通过。AGENTS记录后续按职责目录分组，现有厂商目录未重排。中文heredoc提交与push命令只提供，未执行。

## 证据范围

实现验证限定于受支持的可信工具配置、同步schema和当前两家文本/工具协议。没有自动重试、事务回滚、持久化恢复、OS沙箱、任意第三方schema安全性保证；模型分类不表示该错误可重试。真实模型自主修正/任务质量、第二家服务可用性及学习者独立实现/迁移仍待证据，不授予掌握或企业级成熟结论。

## 阅读反馈后的正文重组验证（2026-11-04）

按学习者“看不清在实现什么”的反馈，只重组07正文与复习/学习记录。补齐旧工具检查与统一执行入口的差别；工具准备前后对象及实际创建者；tools/registry/toolCalls的用途；批次为何先完整反馈、两种执行函数入口与跨轮依赖；结果由执行器返回、Runtime保存再进入下一次输入。分类速查移到日志使用处，功能关系放在类型前。没有增加或修改实现、命令和接口。

本轮对当前含学习者未提交改动的学习源码/根配置及07候选共133份文件做前后SHA256比较，完全一致；所有原代码围栏（含命令）与同源引用计数、内容相同。没有回滚或覆盖学习者正在写的07文件，未运行学习入口或付费服务。

中文标点检查、git diff --check与网站构建通过。4174服务原停止，已恢复；HTTP200。浏览器原失败页失效后改用同一浏览器的新正常页面，实际核对新版导读、功能对照、执行步骤和移到第六步的速查；67个代码折叠、三图加载正常。未改图片及候选，未重复声称新增行为测试。教学表达修订不作为学习者理解或掌握的证据。
