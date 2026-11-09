# 12作者验证记录

2026-11-09在临时候选workspace验证，真实学习目录没有写入。实际分支仍为agent/chapter-11-run-budgets跟踪同名远程；未切分支、暂存、提交、推送、合并或部署。未读取真实.env或凭据，未调用付费模型。

## 程序与记录

- 候选npm run check通过，三个包ESM/DTS构建与工程类型检查通过。
- 两任务×DeepSeek/Anthropic×normal/recover/cutoff/cancel/deadline/budget：24条实际CLI均退出0并到预期路径。另以真实Runtime直接核对24组结果/事件不变量，未把CLI退出0当任务接受。
- normal审查model2/tool2，发布model3/tool3；recover分别多1次坏参数，observerErrors1。实际反馈ID关联、invalid_arguments进入第二次原生请求，参数拒绝不产生读文件结果。
- tool_start数量与toolCalls一致，事件同runId/sequence连续，run_end唯一；已保存反馈ID唯一。cutoff为model_protocol、取消为cancelled、到期为timedOut，均有最终文字预览但无最终assistant/answer，保留此前工具记录。
- 额度1：审查model1/tool1仅invoice；发布model2/tool1仅发布记录，超额服务项不开始。资源等待可退出，没有挂住正常60秒期限。
- 原code-review/release-impact入口×两提供商四组本地固定HTTP回归通过，原默认材料和公开包调用保持。
- 应用有限报告：缺全部读取、缺pricing、空证据清单三组均拒绝。两份读取齐全但改为错误答案仍接受。临时将材料规则改20%，固定旧答案仍accepted，实际函数结果640/正确单折扣800，证明该报告不验证语义；材料已恢复。作者执行业务函数仅为独立数值核对，不是Agent动作。

## 包与教学命令

- 三个包npm pack生成tgz，在仓库外新目录offline安装，仅公开入口导入：正常answered/model2/tool1/hasOwnSource true；tool_end期间取消后cancelled/model1/tool1/hasOwnSource true。
- 外部types.ts使用三个公开包的契约通过严格tsc。未通过仓库内部导入或workspace链接冒充包外消费。
- 正文早期工厂组装命令逐字运行通过；正文整段build/pack/拷贝/外部安装/两次执行逐字通过。live仅提供命令，没有代跑。
- model/runtime/coding-tools共50份src文件与11做TypeScript AST比较，均无语义变化；候选清除了继承的变化标签。
- 109份完整文件引用与分步代码同源；本章正文变化有具体文件/标识符，固定配套与真实执行边界分明。

## 网站与保护

VitePress构建通过；四张SVG实际Chromium渲染检查，中文与箭头无裁切。实际Chromium页面检查通过：4张图加载、111个折叠区、完整代码展开、第三阶段锚点、无页面异常；390px视口无整页横向溢出。窄屏长文件名问题限定在本页summary换行修正。现有大chunk及旧代码语言回退提示不影响构建。

保护基线98份学习源码、材料与根配置SHA256比对无变化。网站、候选和内部记录不算学习者独立实现；24条预写响应不是自主任务完成率，不标记真实模型质量、生产就绪或学习者掌握。

作者临时记录：/tmp/ai12-results.json、/tmp/ai12-external.json、/tmp/ai12-exact-early.txt、/tmp/ai12-exact-pack.txt；脚本及临时目录可能被系统清理，本记录只陈述本次已观察结果。
