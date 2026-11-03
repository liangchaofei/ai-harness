# 第01篇Pi源码核对（2026-11-02）

固定提交：8efd314fa3d3232ce197d8d7a6a5660530b9d83e。直接下载该提交的官方原始文件，未执行Pi代码、未使用浮动main作为行为依据。浏览器文档与实际下载可能行号不同，正文按文件与标识符定位，不依赖缓存行号。

## 实际调用链与发现

- `index.ts`以导出为主，提供商与API实现通过不同模块/子入口接入。旧候选把契约、fetch、解码堆在index，不能声称借鉴了这条边界。
- `types.ts`的Context包含消息与可选systemPrompt/tools；AssistantMessage包含assistant角色、内容块与stopReason等。旧候选把连接配置与消息放进同一个options，结果只保留text和固定stop，只有浅层对应。
- `models.ts`的Models实现先normalizeContext，解析鉴权并委派provider；complete返回stream(...).result()。本章没有这个集合/流式调用链，不写成同一实现。
- `providers/deepseek.ts`配置身份、地址、鉴权、模型目录和共享openAICompletionsApi。当前仅一个提供商，不复制完整注册与目录系统；配置及文本协议暂合一，明确下一次拆分触发条件。
- `api/openai-completions.ts`的mapStopReason保留length，并把工具结束等转换为项目原因；提供商事件流持有完整消息。旧候选一律拒绝length，把模型结果解释与应用接受混合，应修正。
- `utils/event-stream.ts`的AssistantMessageEventStream从done/error取得最终消息，result不等于HTTP非流式调用。本章不复制该实现，HTTP失败仍抛异常，与Pi完整错误结果不同。

## 当前实现与范围

七份源码：types/messages.ts、types/context.ts、types/options.ts、validation.ts、index.ts、providers/deepseek.ts、示例main.ts。借鉴Context/AssistantMessage边界和纯导出入口；保留角色、内容与stopReason；stop/length作为模型结果返回，示例再决定是否交付。

教学简化：字符串内容代替完整内容块，仅一提供商、一次非流式HTTP、不含OAuth/鉴权解析、用量、提供商集合或工具请求。原生fetch、30秒等待、配置显式传入及异常抛出是本项目选择，不能归于Pi。

构建使用tsup8.5.0打包多文件ESM+d.ts以支持包内无扩展名导入；初次与TypeScript7.0.2组合失败，实查ts.sys不存在，无法满足声明打包器需要的编译器API。切换到兼容的TypeScript5.9.3后构建/声明与类型检查通过；不把工具链排错写进教学正文。

## 下载快照SHA256

| 文件 | SHA256 |
|---|---|
| `packages/ai/src/types.ts` | `258627828297eb0165de9828cab62666265a77e932dea5dba1542ace9c47c7d5` |
| `packages/ai/src/index.ts` | `d8f7f7414fcf821c87ea69ee6f95ba654c955491e31586509dc51dbdf54edea8` |
| `packages/ai/src/models.ts` | `c10385291e4e79dc3ea5301629288a35cac354f8a3635c07f9312608c269f573` |
| `packages/ai/src/providers/deepseek.ts` | `4d4ac9870d3dcdb13a90627a95598314459f5cc2f8a122f802fab3b0d2840fee` |
| `packages/ai/src/api/openai-completions.ts` | `8e2b66ed66600e38ab03d12a68338ace5ea0515810a9d1670bd9177f82556465` |
| `packages/ai/src/utils/event-stream.ts` | `9fd5e33a8e295d88b5911af71d7afbfd437c9620288808d18331f16811e24dac` |
| `packages/ai/src/api/lazy.ts` | `1d38468b570b179dc404be7d13b737cb1d001bd96a0a9b3626d8c3f0bf9a49be` |
| `packages/ai/package.json` | `4e9ed07b06a91d844485874c251f312b610d015a4a4fd32c78cde58a7862a3f1` |

## 验证与证据限度

候选在独立临时workspace安装、构建和类型检查；服务均为本地fetch固定响应，未读取真实.env或调用付费模型。18组覆盖正常/length/空文本保留、HTTP/网络/JSON/结构/角色/类型/未知停止原因失败、缺配置及非法输出上限在请求前拒绝、无systemPrompt与上下文不变。

实际应用入口验证stop展示、length先显示模型消息再拒绝最终文本。包的构建与外部消费继续验证，结果记录chapter-01-verification.md。固定响应只证明程序路径，不证明模型自主能力、Pi等价或生产成熟。未创建或改写学习源码目录，未切分支提交推送。
