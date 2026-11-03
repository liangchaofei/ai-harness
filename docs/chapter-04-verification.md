# 04 作者验证记录

日期2026-11-03。实际分支保持agent/chapter-03-tool-feedback；开始时跟踪远程且干净。未切分支/提交/推送/部署，未读取真实.env、未自动调用付费模型。候选site/snippets/04-agent-loop；学习目录保持原样。

## 构建与程序行为

临时工程：`/var/folders/7s/3jb1m_s92z1cr54b6s_b76mc0000gn/T/ai04-loop-rqlkuyna`（指针/tmp/ai04-temp）。复制全量候选、补site workspace占位，离线安装依赖；npm run check通过，三个包ESM/d.ts与整个候选tsc通过。

node verify.mjs通过53项检查。使用固定模型函数或固定HTTP响应，配合真实文件读取及实际main入口，不是自主模型评测。

- 三次调用：错误路径→失败反馈→正确路径→真实源码→文本，输入记录长度1/3/5，最终6项记录。原始初始数组及较早上下文数组不被追加；总体要求保留；调用函数只拿工具说明。
- maxModelCalls=1/2/4：准确发起对应次数，最后一次请求工具不执行，实际工具次数分别0/1/3。最后允许的一次返回正常文本仍answered。
- 截断不执行工具、空文本emptyAnswer；非法上限和空初始消息在调用前拒绝。
- 模型异常failed/model、未知工具异常failed/tools，保留原Error对象供本地调试，停止批内后续工具和后续模型调用；批次assistant只保存一次，结果各关联ID。
- 真实模型适配器接收注入调用，固定HTTP的消息数2/4/6（含system），失败及成功结果与请求ID正确，真实文件内容被发送；Runtime构建JS无DeepSeek绑定。
- 实际入口正常/失败后修正成功/上限/缺成功读取/直接回答/HTTP401/网络异常/截断/空文本分支；默认输出不含注入的敏感异常正文；model阶段、受控HTTP状态与网络代码可观察。实际异常对象不直接打印。

正文第三步heredoc从Markdown提取后原样运行：answered、2次调用、真实工具isError=false；没有请求模型。迁移练习的pricing/cart完整代码与工具映射原样写入临时工程，以固定模型函数串联两个真实读取并回答，三次调用、两项成功工具结果；之后恢复临时工程默认材料。只验证迁移机制，不证明真实模型会主动追引用。

## 包外消费

三个包分别npm pack，在独立消费目录离线安装三个tgz，不通过workspace源码相对导入。注入固定模型函数、读取消费工程自己的sample.ts，runAgent两次调用后answered，公开入口正常。目录：`/var/folders/7s/3jb1m_s92z1cr54b6s_b76mc0000gn/T/ai04-consumer-6xgnkm80`。没有npm发布。

## 正文和网页

步骤与章末文件均引用同一候选。新增接口先构建再导入；默认材料在使用前展示；明确参数来自何处、Runtime复制和push、服务字段往返、循环返回由应用result接住。实现文件变化标签仅保留04新增/修改，公开正文不展示#region。

Waza中文标点检查通过。npm run docs:build通过；本地4174服务已有运行，04返回HTTP200。实际in-app browser检查标题、代码、34个折叠块和两张SVG完整加载；两图分别直接打开完整截图核对中文、箭头与裁切。循环图有反馈回到模型调用的回边，停止结果与继续路径区分；三次轨迹明确标固定样本而非模型能力证据。

## 限制与学习证据

源码前后SHA256核对packages/examples/apps/fixtures及根package.json/package-lock.json/tsconfig.json；这些学习文件未改写。git diff --check通过。

本篇只有非流式、顺序工具和内存记录。数组复制不是深隔离；模型函数为可信注入；最后一次待执行请求不具备续跑恢复协议；调用次数不是token/实际计费/整次时限；没有取消、并发、回滚、自动重试、持久化、多提供商或完整任务质量评估。真实模型运行与04学习者独立实现/迁移仍待取证，不能据53项检查认定掌握或生产可用。

第四步讲解修订：补充reportRun的具体输入、记录示意、打印与执行的区别、停止分支、some四项条件、目标路径换行格式、true/false如何影响入口退出码，以及describeFailure的受控输出。代码实现、命令和学习源码不变；关键hasSource摘录与候选逐字核对。
