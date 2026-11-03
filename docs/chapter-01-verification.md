# 第01篇当前候选验证（2026-11-02）

本记录对应Pi源码核对后的候选；10月30日初稿的generateText/TextResult验证不作为当前接口依据。源码对应、设计差异和下载快照SHA256见chapter-01-pi-audit.md。

## 范围与来源

main仍无提交；作者修改site候选/正文、docs与AGENTS，不写入学习者packages/examples/fixtures，不切分支或提交推送。固定Pi提交8efd314fa3d3232ce197d8d7a6a5660530b9d83e，实际读取index、types、Models.complete/stream、DeepSeek提供商、OpenAI-completions协议及事件流结果实现。不是仅核对Context接口或README。

当前七份源码：types/messages.ts、types/context.ts、types/options.ts、validation.ts、providers/deepseek.ts、纯导出index.ts、示例main.ts。Context与CompleteOptions分开，complete返回assistant消息和stop/length；HTTP/JSON失败抛异常，截断结果由应用决定是否交付。与Pi的流式底层、内容块、提供商集合、完整鉴权和错误机制的差异均在正文标明。

## 构建与程序验证

独立临时workspace地址由/tmp/ai01-pi-temp记录；复制候选与site包配置，npm安装后执行npm run check，ESM、源码映射、d.ts打包与全项目类型检查通过。

tsup8.5.0与TypeScript7.0.2的首次组合失败。检查TypeScript实际导出发现ts.sys不存在，声明打包所需编译器API不可用；候选改锁TypeScript5.9.3后通过。没有把排错历史放进教程，没有关闭类型检查来绕过失败。

18组公开包固定fetch检查通过：正常文本、length保留、空文本保留、上下文不变；HTTP503、网络异常、非法JSON、缺choices、错误choices、空choices、工具停止原因未支持、错误角色、非字符串内容；缺密钥/模型/消息和非法maxTokens在请求前拒绝；无systemPrompt也能转换。

示例入口真实执行：正常stop展示文本；length先显示含停止原因的模型消息，再以非零退出拒绝交付，不输出最终文本。根目录正文npm start及带引号CLI参数传递通过。临时.env是作者自行创建的占位配置，不读取或复制真实.env；所有模型HTTP均被本地固定响应截住，无付费请求。

npm pack构建包，在另一临时目录离线安装tgz，Node原生ESM通过公开@ai-harness/model入口导入complete并保留length结果；不依赖tsx、跨包源码或monorepo内部解析。未公开发布npm。

## 教材与站点

正文按新的四文件实现重写，不插入作者中间版本迁移。配置、导入、分步函数和完整文件同源；入口不堆服务逻辑；图、日志、断点和输出上限实验均更新为Context/messages/AssistantMessage与应用接受边界。

npm run docs:build与git diff --check通过；Waza标点检查通过。4174服务已恢复；实际打开网页确认Pi源码对应表、新complete代码、完整折叠与两图加载，无#region泄漏。两份SVG分别直接渲染截图检查，中文、箭头与数据可读，无重叠裁切。

最终检查候选与临时验证代码一致，根学习源码目录未创建。没有变更用户模型凭据、全局代理配置或旧仓库。

## 不能据此推断

固定响应只验证接入、转换和失败边界，不能证明真实模型审查质量或自主能力。借鉴职责与停止语义不等于复刻Pi；当前没有工具调用、循环、持久化恢复或企业生产可用性证明。学习者是否已实现、理解和独立迁移仍未知。

## 全章讲解复核（2026-11-02）

本轮只优化教学表达。统一检查类型契约、响应转换、complete与应用入口：先说明调用方需要完成的工作，再用同一代码审查任务追踪Context、服务messages、原始响应和AssistantMessage，明确返回值由谁接住、哪些状态没有写回。简单导出保持简短；正常显示、截断、空白和异常在应用侧分开说明。教学数据不作为真实模型表现。

更新technical-tutorial-writer及其章节规范、审稿场景，ai-agent-tutor补充调用功能与数据去向要求；两份skill结构检查通过。按新审稿场景复核本章，未将逐句控制流复述视为完整功能解释，也未把作者复核视为学习者理解证据。

10个候选文件与修改前SHA256逐一一致，全部bash命令保持原样；新增TypeScript摘录均是候选源码的原文子串，标明仅用于阅读而非重复追加。根目录packages/apps/examples/fixtures仍未创建。本轮没有代码变更，未重复调用或扩大模型验证。

网站构建与中文标点检查通过。实际打开4174网页，核对四步讲解、同源摘录和应用分支表；上下文转换段截图排版正常，两图均加载，无#region标记泄漏。

## 类型注释复核（2026-11-03）

四个公共类型均补中文JSDoc，说明用途、创建方与使用方；字段解释角色、可选行为、停止原因、token上限默认值和readonly数组限制。正文说明readonly不是深度冻结，也不自动保存历史。分步和章末仍引用同一候选。

去除注释和空白后，types.ts声明与改动前完全一致；临时工程的TypeScript检查通过。两份skill结构检查、Waza标点检查与网站构建通过。实际网页确认两处类型代码均展示注释，无#region泄漏，截图核对排版。没有新行为，未发起模型请求。

实际分支agent/chapter-01-model-call尚无提交。学习者已创建packages/examples中的4份文件，本轮核对哈希保持不变，不覆盖学习源码。注释改动不构成掌握证据。

2026-11-03：补充第二步中两个辅助函数的归属与抽离条件：isRecord是可复用判断、当前文件内保留；decodeMessage属于服务响应适配。区分包内共享校验、适配内部拆分与实际协议复用，不新增文件、不改代码。

## 包内校验抽离（2026-11-03）

按用户要求立即落实：新增候选packages/model/src/validation.ts，导出isRecord；deepseek.ts通过../validation导入，不再定义同名函数。decodeMessage与complete保留在提供商适配内，index.ts不导出内部校验。新增文件有中文用途与边界注释。正文同步创建顺序、依赖方向、文件清单与五份完整文件；此前就近保留的说明已替换。

将最新候选复制到原独立临时workspace，执行npm run check与18组固定响应行为检查全部通过；公开入口和响应转换行为保持不变，真实模型请求0次。网站构建、中文标点检查通过；实际网页核对新文件、导入与同源完整引用，截图检查排版。已有5个学习文件哈希未变。未切分支、提交、推送或部署。

## 入口编辑器报错定位（2026-11-03）

用户截图中包导入与process标红。实际检查配置已声明@types/node与workspace依赖，但node_modules/@types/node、node_modules/@ai-harness/model和packages/model/dist均不存在。执行根目录npm install，再运行npm run check，ESM与声明构建及项目类型检查全部通过；未修改学习源码，未读取.env或运行模型入口。npm安装更新依赖及锁文件，构建仅生成dist。

正文补充安装构建前的暂时编辑器错误说明，以及安装、workspace连接、生成声明文件之间的关系；保留包入口导入。网站构建和标点检查通过。命令行检查通过不等于已观察到VS Code错误消失；若编辑器缓存仍在，提示重启TS Server。

## 从01直接采用类型目录（2026-11-03）

用户要求减少重复迁移，最终正文以01直接创建src/types/messages.ts、context.ts、options.ts为起点。01候选删除总types.ts，内部类型导入与公开index同步，分步与七份完整文件一致；02沿用这套结构，仅新增工具类型并扩展消息和上下文，不再要求移动类型文件或重写配置类型。此前同日关于迁移的记录是作者修订历史。

01临时工程删除总types.ts、复制最新候选后，构建、声明及项目类型检查与18组公开包固定响应验证通过。02对应检查和30组固定响应验证通过。两篇手写摘录与各自候选一致；9个既有学习文件哈希未变。网页实际核对01创建路径、02替换步骤、沿用文件和完整引用，无旧总类型文件操作或#region泄漏。网站构建和标点检查通过；没有真实模型调用、学习源码改写或Git提交推送。
