# 21 把被省略的验收证据带回本轮输入

第 20 篇能保留近期完整工具批次。可是一旦较早的验收反馈离开本轮输入，模型可能知道最后一次验收通过了，却说不清第一次到底哪个用例失败。

## 本篇技术方案

**功能目标。** 用户照常提交任务。当一次验收反馈被省略时，让模型收到一条可回查的摘要，能说清旧验收发现了什么、最近一次验收的结果，以及当前是否需要重验。

### 实施前，先走完一次具体过程

1. **第一次验收发现根路径出错。** 模型改了路径处理函数，验收发现 `/` 被变成了空字符串。Runtime 保存失败反馈。模型修正后再次验收，通过的反馈也存入完整历史。
2. **下一轮输入只留下最近的通过反馈。** CLI 在发送前缩减输入，第一次失败的原文被省略。此时如果问「第一次哪个用例失败」，仅凭最近一批消息找不到答案。
3. **CLI 从完整历史取回一小段证据。** 它摘出失败用例 `/` 和能查回原文的位置，把摘要放进本轮输入。完整历史仍由 Runtime 保存，CLI 仍用当前文件对应的验收结果判断交付。

这里在 CLI 输入准备阶段做固定字段提取。原始反馈留在历史里，摘要只带模型回答眼前问题所需的信息。首次阅读先追 `/` 怎么回到输入，等这条路径走通，再看通过后又改文件为什么要重验。

### 先看一条输出

在装好项目依赖的仓库根目录，直接运行教程提供的观察脚本。它用两条人工反馈演示裁剪后的情形，无需先写本章代码，也无需模型密钥。

```bash
node --import tsx site/snippets/21-evidence-summary/examples/evidence-summary/inspect-summary.ts
```

在输出里先找 `omitted.failedInput`。它是 `"/"`，来自被省略的那次验收。再看 `latest.outcome`，它是 `"passed-at-check"`，来自最近一次验收。两个结果可以同时成立。后面就沿这两条记录读代码。

### 验收标准

- 同样的近期消息，有摘要时，第四轮能指出第一次失败的是 `/` 并回查来源。移除摘要后，第四轮的固定检查报告缺少依据。
- 最近一次验收通过后，如果又出现写入反馈，摘要应提示重验。第五步单独验证这个边界。

## 动手前

以完成第 20 篇的源码为起点。确认已有 `selectInput`、内部字节目标和 `examples/input-budget` 固定观察入口。先检查工作区；第 20 篇的修改保存后再创建本章分支：

```bash
git status --short
git switch -c agent/chapter-21-evidence-summary
```

## 第一步：从失败反馈里取出 `/`

先沿着一条反馈找出失败用例。工具把进程结果放进 `message.content`，验收脚本又把用例报告打印进进程结果的 `stdout`。所以代码需要打开两层，才能从用例里取到 `/`。

```ts
const result = objectFromJson(message.content);
const report = typeof result.stdout === 'string' ? objectFromJson(result.stdout) : {};
```

第一行得到进程结果，能看到 `status: "failed"`。第二行得到验收报告，能看到 `cases`。在数组里找第一条 `passed: false` 且有字符串输入的用例，取出它的 `input`，就得到 `failedInput: "/"`。这两行已包含在下一步的完整实现里。

![同一条反馈，两次解码](/diagrams/21-decode.svg)

::: details 展开查看工具返回的原始格式

以下节选自运行报告中的 `check_partial`，省略其他用例。

```json
{
  "role": "toolResult",
  "toolName": "run_check",
  "toolCallId": "check_partial",
  "isError": false,
  "content": "{\"status\":\"failed\",\"exitCode\":1,\"stdout\":\"{\\\"passed\\\":false,\\\"cases\\\":[{\\\"input\\\":\\\"/\\\",\\\"expected\\\":\\\"/\\\",\\\"actual\\\":\\\"\\\",\\\"passed\\\":false}]}\"}"
}
```

`isError: false` 表示工具正常返回了结果。`status: failed` 和 `exitCode: 1` 表示验收没通过。具体差异在用例报告里，预期为 `/`，实际是空串。

:::

## 第二步：实现摘要和来源定位

先用开头那个两条消息的例子。完整历史 `history` 里有「失败、通过」，本轮选中的 `selected` 里只有「通过」。这个函数要交回一条摘要，让 CLI 可以把旧失败带进本轮。下面两处摘录都已包含在完整实现中。

**怎样从一条反馈得到一条可回查的记录？** 上一步已经拿到 `failedInput`。这行再保存消息在完整历史里的位置和请求 ID。

```ts
checks.push({ index, id: message.toolCallId, outcome, failedInput });
```

小例子里，`check_partial` 在 `history[0]`，所以第一条记录带着 `index: 0` 和 `failedInput: "/"`。CLI 的完整运行还有任务消息、工具请求和其他反馈，同一条失败记录在那里是下标 6。

**怎样知道哪次验收被省略？** 用每条记录的 `index` 找回原消息，再看原消息是否还在 `selected` 里。

```ts
const kept = new Set(selected);
const omitted = checks.filter((check) => !kept.has(history[check.index]!)).at(-1);
const latest = checks.at(-1);
if (!omitted || !latest) return undefined;
```

`history[0]` 对应的失败反馈没有留在 `selected`，于是它成为 `omitted`。最后一次验收仍从完整的 `checks` 取，所以 `latest` 是通过的那条。这里能直接用集合查找，是因为输入选择保留了同一份历史中的消息对象。

先在心里试一个变化。如果 `selected` 也保留第一次失败，函数还会返回摘要吗？

::: details 对照结果

两条验收都保留时，`omitted` 取不到值，函数返回 `undefined`。

:::

现在新建 `apps/coding-cli/src/context/evidence-summary.ts`。先按上面两处定位代码，返回消息里关于重验的字段可以留到第五步再读。

<<< @/snippets/21-evidence-summary/apps/coding-cli/src/context/evidence-summary.ts

::: details 接入 CLI 后，在完整历史里核对位置

在这次固定运行的末轮准备阶段，完整历史有 10 条：

| 零基下标 | 完整历史里的内容 | 本轮是否发送原文 |
|---|---|---|
| 0 | 用户任务 | 保留 |
| 1 到 3 | 第一次模型请求及两条读取反馈 | 省略 |
| 4 到 6 | 第一次修改与验收请求，以及两条反馈 | 省略；从下标 6 提取失败摘要 |
| 7 到 9 | 修正与重验请求，以及两条反馈 | 整组保留 |

这里的 6 是数组下标，即第七条消息。沿 `history[6].toolCallId` 找到 `check_partial`，再从 `stdout` 找到 `/`。下标的含义限于这次运行。

:::

### 先单独运行摘要，不等 CLI 接完

新建 `examples/evidence-summary/inspect-summary.ts`。它用两条人工构造的验收反馈来模拟裁剪完成后的状态：`history` 有失败和通过两条记录，`selected` 只保留后者。这个入口直接调用摘要函数，不经过工具分组，也不会发请求。

<<< @/snippets/21-evidence-summary/examples/evidence-summary/inspect-summary.ts

在仓库根目录运行：

```bash
node --import tsx examples/evidence-summary/inspect-summary.ts
```

先核对这三个值，再接 CLI：

| 字段 | 预期 | 怎么核对 |
|---|---|---|
| `omitted` | 下标 0、`check_partial`、失败用例 `/` | 回到 `history[0]` 解码 `stdout` |
| `latest` | 下标 1、`check_complete`、`passed-at-check` | 即使通过反馈仍在 `selected`，它也是完整历史中的最近验收 |
| `needsRecheck` / `pending` | `false` / `null` | 最后一次验收通过，且样本里没有之后的写入 |

这里的下标是 0 和 1，因为样本只构造了两条反馈。真实 CLI 的下标 6 和 9 还计入任务、请求和其他反馈。不要把示例下标写进摘要函数。

**可以先停在这里。** 能用 `history[0]` 指出 `omitted.failedInput` 的来源，再说明 `latest` 为什么仍然是通过，就已经走完了本章的核心提取逻辑。接下来再把这条摘要交给 CLI。

## 第三步：只把摘要加到本轮输入

第二步已经得到一条写着「第一次失败的是 `/`」的摘要。现在只追它怎么交给模型。先看 `prepareMessages` 里的这两处。

```ts
const summary = summarizeChecks(history, selected);
```

这行同时传入两份消息。用 `history` 回查旧失败，用 `selected` 判断旧失败的原文是否还会发送。拿到摘要后，把它插在原任务和近期批次之间。

```ts
const input = summary
  ? [...selected.slice(0, boundary), summary, ...selected.slice(boundary)]
  : selected;
```

`boundary` 是开头连续用户消息之后的位置。以路径修复为例，原任务在前，接着是带 `/` 的摘要，最后才是修正与验收通过的完整批次。回调最后 `return input`，Runtime 用这个数组发本轮请求。下面的完整文件已包含这两段。

完整替换 `apps/coding-cli/src/session/run.ts`。保留原有 `runSession` 签名、工具、系统提示、运行预算和报告路径，增加摘要调用，并在超过字节目标时为摘要预留 1,024 字节。

<<< @/snippets/21-evidence-summary/apps/coding-cli/src/session/run.ts

![完整历史与本轮摘要分开](/diagrams/21-summary-boundary.svg)

摘要使用现有消息协议里的 `user` 角色承载，并明确标成应用生成的历史数据。插入在任务消息后、近期批次前，不拆开任何请求与反馈。它只从回调返回，下次仍从原历史重新计算。预留值是教学余量；如果任务、最近批次和摘要实际更大，仍如实报告 `overBudget`，不是服务硬上限。

## 第四步：让固定模型必须找到早期失败证据

普通修复示例的最后一轮只检查最近一次验收，即使没收到摘要也可能通过。要验证本篇增加的能力，得让最后一轮回答一个明确问题：**第一次验收哪个用例失败？**

新建 `examples/evidence-summary/main.ts`。前 3 轮复用第 20 篇的固定模型与真实工具；第 4 轮先确认原始失败反馈确实被省略，再检查当前输入能否提供早期失败用例。

<<< @/snippets/21-evidence-summary/examples/evidence-summary/main.ts

`cut-only` 只在本地固定模型入口移除应用生成的摘要，保留同一组近期原始消息；`summary` 原样接收。它们是观察入口的模式，正常 CLI 不增加参数。断在 `messages` 赋值后看实际交给探针的数组；CLI 此前打印的 `inputBytes` 是移除摘要前的值，不用于比较两个探针的输入大小。

```bash
npm run check
node --import tsx examples/evidence-summary/main.ts cut-only
node --import tsx examples/evidence-summary/main.ts summary
```

第一条观察命令预期退出 1，第二条退出 0，分别运行即可。实际结果：

| 对照 | 第 4 轮能否定位第一次失败 | 最终结果 |
|---|---|---|
| 仅裁剪 | 无原始反馈，也无摘要，明确报缺依据 | 未接受 |
| 有摘要 | 从摘要读到 `input: '/'`、`index: 6`、`id: 'check_partial'` | 固定模型完成，实际验收通过 |

两次的文件修复与验收都已在第 3 轮完成。仅裁剪未接受，是因为**最后一轮证据探针失败，运行没有正常回答**，不表示文件验收失败。有摘要的候选末轮从 4,761 字节选为 2,602 字节（含摘要）。这个对照只证明信息送达与固定检查，不证明真实模型会正确使用它。

![第四轮：只改变摘要是否可见](/diagrams/21-probe.svg)

## 第五步：验证旧通过不会变成当前通过

先看末轮摘要的三个来源：旧验收 `check_partial` 在下标 6，最近写入 `edit_complete` 在下标 8，最近验收 `check_complete` 在下标 9。此时写入早于通过验收，所以没有生成重验待办。

```ts
const needsRecheck = (lastEdit?.index ?? -1) > latest.index ||
  latest.outcome !== 'passed-at-check';
```

把最近写入想象成发生在下标 9 之后。第一项条件就会成立，`pending` 随之变成“重新运行验收”。这里按写入工具反馈的位置保守判断，即使一次替换失败也可能提示重验。第二项条件负责处理最近一次验收未通过、工具出错或无法解码的情形。原任务仍从用户消息取得，`latestEdit` 只记录写入反馈的位置和结果。

![摘要提取和过期判断](/diagrams/21-evidence-source.svg)

用刚才的独立入口复现，不必改文件或真的再执行一次工具：

```bash
node --import tsx examples/evidence-summary/inspect-summary.ts stale
node --import tsx examples/evidence-summary/inspect-summary.ts malformed
```

`stale` 在人工历史中追加写入反馈：`latest.index` 仍是 1，`latest.outcome` 仍是 `passed-at-check`，但 `latestEdit.index` 为 2，所以 `needsRecheck` 为 true，`pending` 为“重新运行验收”。`malformed` 用不可解析的正文替换最近验收：`latest.outcome` 为 `unknown`，也会提示重验。回到无参数运行就恢复基线。

两条命令都正常退出，因为它们在展示摘要，不在判断任务交付。真正的交付仍要用 CLI 重新取得当前内容及匹配的验收证据。

![通过后再写入，为什么需要重验](/diagrams/21-recheck.svg)

## 第六步：接回真实模型，分别核对摘要与验收

完成本篇代码后，沿用第 19 篇的服务配置，从仓库根目录运行。下面的 CLI 会调用实际模型服务，可能产生费用：

```bash
npm run check
node --env-file=.env apps/coding-cli/dist/cli.js --task fixtures/code-tasks/route.json
```

这个入口没有注入固定模型。CLI 通过默认的 `createModelCall` 接入服务，Runtime 仍在每次发请求前等待本篇的 `prepareMessages`，再把返回的消息交给模型调用。无需添加摘要开关。

| 要验证什么 | 看哪里 | 能说明什么 |
|---|---|---|
| 摘要是否生成 | 某轮的 `hasEvidenceSummary: true` | 输入准备已生成摘要；单看日志还不能证明请求已发出 |
| 本轮准备发送什么 | 在 `return input` 前查看摘要和近期批次；对照原始工具反馈的下标和 ID | 哪些旧验收事实进入了本轮输入，来源是否一致 |
| 模型是否引用了证据 | 对照实际回答、同轮输入和原始反馈 | 能核对陈述是否有依据；一次正确回答不能证明是摘要带来的 |
| 任务是否交付 | 查看 `answered`、匹配当前内容的验收和 `accepted` | 交付由实际运行与验收证据决定，不能用摘要代替 |

真实模型可能一次修好，也可能走不同的调查路径。如果全程没有省略验收、`hasEvidenceSummary` 始终为 false，这次只能验证真实 CLI 路径，不能算验证了摘要进入真实请求。保留观察结果即可，不必反复付费重跑。若要验证摘要是否改善效果，另用确实会省略旧验收的任务，按同一模型、材料与约束比较有无摘要。

本篇已实测固定响应配合真实文件操作和验收；真实模型验证步骤供读者执行，作者未调用模型服务。

## 断点：追踪同一条反馈从历史进入模型输入

用下面的命令启动调试，再附加到 Node：

```bash
node --inspect-brk --import tsx examples/evidence-summary/main.ts summary
```

1. 在 `session/run.ts` 的 `summarizeChecks(history, selected)` 调用处停在第 4 轮。查看 `history[6]`，请求 ID 应为 `check_partial`；再看 `selected`，里面没有这条反馈，但有 `check_complete`。
2. 进入 `evidence-summary.ts`，在 `checks.push` 处观察 `index === 6` 的那次执行。对照 `result.status`、`report.cases`、`failedInput`：外层为失败，内层失败用例为 `/`。
3. 在 `session/run.ts` 的 `return input` 处检查顺序：原任务、摘要、近期完整批次。此时 `history[6]` 仍是原始工具反馈。
4. 在观察入口的 `console.log('早期失败用例', ...)` 处检查 `evidence.omitted`。它能用来源回查原文，但提供给模型的是摘要字段。换成 `cut-only` 后应停在“本轮输入没有依据”的分支。

## 小迁移：换一组用例，验证提取规则

在独立观察脚本中，把两次验收的用例输入从 `/` 改成 `/docs/`，把旧请求 ID 改成 `check_docs`。不改摘要函数，预测默认运行的 `omitted.failedInput`、`omitted.id` 和 `pending`；再用 `stale` 模式验证待办会变化，但旧用例来源不会变化。结束后恢复示例。这个练习验证同一条提取规则能处理不同反馈，不是在验证路径修复的新业务规则。

[Pi 固定版本的 compaction 实现](https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/coding-agent/src/core/compaction/compaction.ts)区分待摘要消息和保留区，并记录保留区起点。本篇只借鉴这个职责划分：摘要由确定性规则从真实反馈提取，不另调模型，也不持久化。

## 本章完整文件核对

这里只列本章新增或替换的文件；与正文使用同一份候选。第 20 篇的固定模型、输入选择器和验收材料继续复用。

::: details apps/coding-cli/src/context/evidence-summary.ts

<<< @/snippets/21-evidence-summary/apps/coding-cli/src/context/evidence-summary.ts

:::

::: details apps/coding-cli/src/session/run.ts

<<< @/snippets/21-evidence-summary/apps/coding-cli/src/session/run.ts

:::

::: details examples/evidence-summary/inspect-summary.ts

<<< @/snippets/21-evidence-summary/examples/evidence-summary/inspect-summary.ts

:::

::: details examples/evidence-summary/main.ts

<<< @/snippets/21-evidence-summary/examples/evidence-summary/main.ts

:::

## 保存本篇

```bash
git status --short
git add apps/coding-cli/src/context/evidence-summary.ts apps/coding-cli/src/session/run.ts examples/evidence-summary
git commit -F - <<'EOF_COMMIT'
在有限模型输入中保留带来源的验收摘要

从被省略的真实验收反馈提取事实，保留来源下标和请求 ID。
每轮重新核对后续修改，摘要只进入本轮输入，不替代验收。
EOF_COMMIT
git push -u origin agent/chapter-21-evidence-summary
```
