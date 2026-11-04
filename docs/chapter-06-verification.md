# 06 作者验证记录

日期：2026-11-04。工作分支仍为agent/chapter-05-runtime-reuse，未切分支、暂存、提交、推送或部署。起点三份未提交内部记录保存原用户05证据；未回滚。没有读取真实.env、输出凭据或请求付费模型。

## 候选与来源

完整候选：site/snippets/06-model-providers。读取Pi固定版本与第一方协议后设计，依据见chapter-06-pi-audit.md。当前Anthropic配置示例采用claude-haiku-5-5/关闭思考/API2026-10-21；仅实现非流式文本和自定义工具，不宣称任意Claude型号或完整Pi能力。

临时工程：/var/folders/7s/3jb1m_s92z1cr54b6s_b76mc0000gn/T/ai06-provider-xa_pyszr。离线安装相同依赖，补临时site workspace占位，npm run check成功：三个库构建及公开声明生成、全工程tsc均通过。未覆盖学习源码。

## 48项机制检查与4条实际入口路径

verify-06.mjs以固定HTTP响应调用公开模型包、原Runtime及真实文件工具，48项通过：

- Anthropic文本/多文本块/空文本、单项及批次工具请求、length保留。
- 请求地址、Bearer头、API版本、system独立字段、input_schema、关闭思考、默认输出上限及单请求signal；密钥不进入正文。
- 项目四条记录编码为三条服务消息，两项反馈合并、原ID和is_error保留；原记录不变。历史非法JSON/数组/null/数字参数在发送前拒绝。
- 重复ID、无请求却声明tool_use、end_turn夹工具、错误角色/内容/ID/名称、未知块与未知停止、refusal/上下文限制明确失败。
- 无总体要求/工具时不发送相应字段；DeepSeek原stop/length/tool_calls及不传provider的旧调用方式回归。
- 缺Key/模型/消息、不支持provider、无效上限在发送前拒绝；HTTP401不返回原服务正文，坏JSON保留失败。
- 两家都经真实read_file读取实际cart材料并进入第二次输入；相同Runtime持有记录，输入数组未被追加。
- 两条无Key观察命令实际退出0，answered/2；未知停止与截断均不执行新动作；应用配置使用对应服务的Key/默认模型，不拿另一家Key补位。

另外使用entry-hook-06.mjs替换HTTP等待，实际执行examples/run.ts：DeepSeek/Anthropic × code-review/release-impact，共4条路径通过，两个任务都按原接受条件退出0。发布第二轮两项查询、第三轮完整反馈经过原编解码与Runtime；没有为提供商增加任务或内核分支。固定动作与文字均不作为模型自主证据。

## 正文命令与可逆实验

第五步公共complete的heredoc在临时工程按正文运行，返回固定文本、stop、空toolCalls，无网络。

Anthropic第二份样本end_turn改pause_turn：退出1，failed/model/2次调用，保留第一轮读取结果，无正常文本交付。诊断行在stderr，验证脚本合并stdout/stderr核对。恢复后正常通过。

第一份样本路径改src/missing.ts：原工具返回已知失败，第二次正文tool_result.is_error为true；固定第二份文本仍使Runtime answered，但原应用拒绝交付并退出1。恢复路径后answered/2与应用接受通过。没有把预写答案视为读取证据。

## 仓库外消费

三个库分别npm pack，在独立工程离线安装tgz；目录：/var/folders/7s/3jb1m_s92z1cr54b6s_b76mc0000gn/T/ai06-consumer-5yhka8r0。

通过公开包入口选择两种提供商，固定HTTP配同一runAgent/read_file读取消费工程自己的sample.ts，分别两轮answered，原ID正确、第二次输入含真实文件内容。公开ModelProvider/CompleteOptions/ModelCall的外部TypeScript检查通过。没有依赖workspace源码相对导入，没有发布npm。

## 网站与学习源码保护

npm run docs:build成功；已有大chunk提示，非构建失败，没有因此改打包策略。中文标点检查通过，72处同源代码引用均存在。导航/首页/阶段路线更新，第二阶段06–12逐篇安排公开；接口尚未冻结。

4174服务原未运行，已恢复npm run docs:dev；本章HTTP200。实际in-app browser检查标题、侧栏、三张图加载、57个完整文件折叠；打开index.ts折叠核对公开导出，无#region。三张SVG分别完整截图检查中文、箭头、排版与裁切；修正适配器分支箭头与本地index推进顺序后重新渲染。阶段锚点第二阶段-逐篇大纲存在，正文链接可对应。

packages/examples/fixtures/apps学习文件及根package.json/package-lock.json/tsconfig.json共47份文件前后SHA256与文件集合一致。候选runtime/coding-tools相对05仅清除继承教材变化标记，执行实现不变。git diff --check通过。提供了中文heredoc提交与push命令，没有代执行。

## 未获证据

第二家真实服务尚无Key，账户可用性、线上兼容、真实模型自主轨迹与任务质量未验证。固定响应只验证当前受支持协议和程序路径，不能作为学习者独立实现/迁移/掌握证据，也不能证明生产成熟。第一阶段独立迁移与语义质量缺口继续保留；阶段二逐步补工具契约、事件、流式、取消与整次预算。
