# 23 在同一个任务里继续追问

路径修好了，你接着问「第一次验收是哪个用例失败？」如果 CLI 为这句话重新复制一份工作区，旧验收结果就不在新会话里了。第 23 篇给现有 CLI 加一条可选追问，让它接着同一份工作副本和历史回答，再比较两种输入策略能把哪些依据交给模型。

## 本篇技术方案

### 实施前，先走完一次具体过程

1. **CLI 加载任务并准备一个副本。** 首段照常读文件、修复、验收。固定示例里，第一次验收发现根路径 `/` 出错，修正后第二次通过。
2. **首段回答结束，CLI 追加用户追问。** 它取 Runtime 返回的完整历史，拼上一条新的用户消息，再调用同一个运行入口。第二段复用原来的副本、工具和验收状态。
3. **第二段准备输入，再回答。** 全量策略能看到第一次失败的原始反馈。自动策略省略了原始反馈，但第 21 篇的摘要把失败用例及来源带回来。第 22 篇的外部笔记也可以在场，两组都拿到它。
4. **CLI 审阅当前副本。** 第二段回答结束后，报告仍用匹配当前内容的实际验收判断交付。输入对照另看模型调用次数、消息字节和答案依据。

### 实现架构图

![一次 CLI 进程怎样接续同一个任务](/diagrams/23-follow-up-flow.svg)

这里先做一条在启动时传入的追问。每段有独立的运行 ID、调用预算和时限，两段按顺序运行。会话对象留在当前进程里，第五阶段再做进程退出后的会话保存与恢复。

### 先看结果

装好项目依赖后，在仓库根目录运行教程自带的预览脚本。它使用五条人工消息和 1 字节目标，直接调用输入选择器。无需先改学习源码。

```bash
node --import tsx site/snippets/23-task-follow-up/examples/task-follow-up/inspect-input.ts
```

你会看到「修复页面路径」「第一次验收是哪个用例失败？」以及完整的工具请求和反馈。首段回答被省略了。先带着这个问题往下读：**为什么最后一组已经是工具反馈，用户刚问的问题还能留下？**

### 验收标准

- 不传追问时仍只运行一段。首段没有正常回答时直接报告停止结果。
- 有追问时只创建一个副本。两种输入策略都能给出 `/` 和真实验收依据，并交付同一份修复。
- 目标过小时，原任务、最新追问和最近完整工具批次仍保留。报告照常能查到原始工具反馈。

## 本篇核心代码在哪

先认准一个入口：`apps/coding-cli/src/main.ts` 的 `runCli`。首段 `runSession` 返回 `first` 后，`nextInput.messages` 把 `first.messages` 和新的用户追问拼成第二段的起点。随后，第二次 `runSession` 继续传入同一个 `session`。**前一句保住历史，后一句保住工作副本。** 这两处就是本篇实现「同一任务继续追问」的核心，[第三步有完整代码和数据轨迹](#第三步-把上一段历史交给下一段)。

读其他文件时，可以用各自解决的问题来定位：

| 读到哪里 | 这一段解决什么 |
|---|---|
| `config/args.ts` 的 `parseArgs` | 把终端传来的追问读成 `options.followUp` |
| `session/run.ts` 的 `runSession` | 把第二段的历史起点交给 Runtime，并为每次模型调用准备输入 |
| `context/select-input.ts` 的 `selectInput` | 历史太长时，避免把正在回答的追问裁掉 |
| `examples/task-follow-up/main.ts` | 对照两种策略，检查模型能否从实际输入找到第一次验收失败的依据 |

## 动手前

从第 22 篇接着做。确认仓库已有 `fixtures/code-tasks/route-memory.json` 任务配置、`fixtures/code-tasks/task-memory.json` 笔记数组，以及 `examples/input-budget/sample-model.ts`。保存上章的改动后再开分支。

```bash
git status --short
git switch -c agent/chapter-23-task-follow-up
```

## 第一步：在裁剪时保住追问

第 20 篇保留原任务和最后一组。在上面的五条消息里，最后一组已变成新一批工具请求和反馈。如果输入太小，旧规则会把追问留在裁剪线外。这样模型刚得到工具结果，却可能丢掉它要回答的问题。

打开 `apps/coding-cli/src/context/select-input.ts`。在 `selectInput` 内，从 `let recent = groups.pop() ?? [];` 开始，替换到函数最后的返回语句，保留末尾花括号。下面是完整替换段。

```ts
  // 【修改】最新追问可能早于最后一批工具结果，单独保留。
  const followUpIndex = groups.map((group) => group[0]!.role).lastIndexOf('user');
  let recentStart = Math.max(0, groups.length - 1);

  // 当近期窗口尚未包含追问，把它放在近期窗口前。窗口包含它时只取一次。
  const inputFrom = (start: number): Message[] => [
    ...task,
    ...(followUpIndex >= 0 && followUpIndex < start ? groups[followUpIndex]! : []),
    ...groups.slice(start).flat(),
  ];

  for (let index = recentStart - 1; index >= 0; index -= 1) {
    if (messageBytes(inputFrom(index)) > budget) {
      break;
    }
    recentStart = index;
  }
  return inputFrom(recentStart);
```

在同一文件的 `selectInput` 中，取出开头的原任务后，找到下面这两行。它们已包含在完整文件里。

```ts
const followUpIndex = groups.map((group) => group[0]!.role).lastIndexOf('user');
let recentStart = Math.max(0, groups.length - 1);
```

此时 `task` 是原任务，`groups` 里依次是首段回答、追问和工具批次。因此 `followUpIndex` 是 1，`recentStart` 是 2。`inputFrom(2)` 会把 `groups[1]` 单独放在工具批次前，因为追问还没进入从下标 2 开始的近期窗口。循环试着把窗口扩到下标 1 时，追问已经在窗口里，代码就只从窗口取一次。目标太小时，扩展会停止，函数仍返回原任务、追问和最新批次。

### 把追问放在近期批次前，且只放一次

在 `apps/coding-cli/src/context/select-input.ts` 中看下面的摘录。它已包含在本步的完整实现里。

```ts
  const inputFrom = (start: number): Message[] => [
    ...task,
    ...(followUpIndex >= 0 && followUpIndex < start ? groups[followUpIndex]! : []),
    ...groups.slice(start).flat(),
  ];

  for (let index = recentStart - 1; index >= 0; index -= 1) {
    if (messageBytes(inputFrom(index)) > budget) {
      break;
    }
    recentStart = index;
  }
  return inputFrom(recentStart);
```

在 `selectInput` 的五条消息样本里，首次组装从下标 2 开始，`followUpIndex = 1` 小于 `start = 2`，所以第二项展开一条追问，第三项展开两条工具消息。试着把窗口扩到下标 1 时，`followUpIndex < start` 为 false，追问改由第三项带入，候选仍只有一份追问。再扩到下标 0 才会多出首段回答。循环按候选数组的字节数决定是否更新 `recentStart`，最后返回实际选中的输入。

![从末尾保留工具批次，再把追问带上](/diagrams/23-follow-up-window.svg)

::: details 完整文件 context/select-input.ts
<<< @/snippets/23-task-follow-up/apps/coding-cli/src/context/select-input.ts
:::

新建 `examples/task-follow-up/inspect-input.ts`，把下面的完整示例写入。这个脚本构造那五条消息，调用你刚改好的选择器，再逐条打印选中结果。

::: details 完整示例 inspect-input.ts
<<< @/snippets/23-task-follow-up/examples/task-follow-up/inspect-input.ts
:::

```bash
node --import tsx examples/task-follow-up/inspect-input.ts
```

**可以先停在这里。** 试着预测把预算从 `1` 改为 `4096` 后，首段回答会不会出现、追问会出现几次。核对后恢复预算。

## 第二步：让 CLI 读到一条追问

打开 `apps/coding-cli/src/types/task.ts`，先加 `import type { Message } from '@ai-harness/model';`。在 `CliOptions` 的普通任务分支中，紧接 `planning: boolean;` 加入：

```ts
      /** 【新增】第一段正常回答后提交的一条追问，省略时只运行一段。 */
      followUp?: string;
```

然后在文件末尾追加下面的接口。`messages` 为第二段提供历史起点，`fullHistory` 让观察脚本选择全量对照。

```ts
/** 【新增】应用给单段运行的输入选项。正常 CLI 使用默认输入策略。 */
export interface RunInputOptions {
  /** 第二段的完整起点，含上一段历史和本次追问。省略时从原任务开始。 */
  messages?: readonly Message[];
  /** 观察入口用的全量对照。为 true 时保留全量历史，跳过裁剪和验收摘要。 */
  fullHistory?: boolean;
}
```

::: details 完整文件 types/task.ts
<<< @/snippets/23-task-follow-up/apps/coding-cli/src/types/task.ts
:::

打开 `apps/coding-cli/src/config/args.ts`。在 `parseArgs` 里的 `let planning` 后添加 `let followUp: string | undefined;`。在参数循环中，找到以 `} else if (arg === '--task'` 开头的整行，在它前面插入：

```ts
    } else if (arg === '--follow-up' && followUp === undefined) {
      // 【新增】读取一条用户追问。引号由终端处理。
      const value = args[++i]?.trim();
      if (!value || value.startsWith('--')) {
        throw new Error('追问内容缺失。');
      }
      followUp = value;
```

原来的 `--task` 行开头的花括号会闭合这个分支。终端引号让整句追问作为一个参数，空值和重复传入会走参数错误。在函数的返回对象中紧接 `planning,` 加入 `...(followUp ? { followUp } : {}),`，让 `runCli` 能拿到问题。最后在 `helpText` 加上 `[--follow-up <问题>]` 和用途说明。

::: details 完整文件 config/args.ts
<<< @/snippets/23-task-follow-up/apps/coding-cli/src/config/args.ts
:::

## 第三步：把上一段历史交给下一段

打开 `apps/coding-cli/src/session/run.ts`，把 `RunInputOptions` 加入已有的 `../types/task` 类型导入，再在 `runSession` 的 `onEvent` 参数后加 `inputOptions: RunInputOptions = {},`。在 `runAgent` 配置对象中替换原来的 `messages` 属性：

```ts
    // 【修改】第二段复用上一段的完整历史，并从追加的追问继续。
    messages: inputOptions.messages ?? [
      {
        role: 'user',
        content: task.prompt,
      },
    ],
```

首段没有传入历史，会从 `task.prompt` 开始。第二段从调用方给出的历史开始。在同一函数的 `prepareMessages` 回调中，用下面这段替换 `const selected` 和 `const summary`。全量对照跳过裁剪和摘要，两组都继续使用同一条外部笔记。

```ts
      // 【修改】全量对照使用同一条外部记忆，区别只在历史选择和摘要。
      const selected = !inputOptions.fullHistory && historyBytes + memoryBytes > MESSAGE_BUDGET_BYTES
        ? selectInput(history, MESSAGE_BUDGET_BYTES - memoryBytes - 1_024)
        : history;
      const summary = inputOptions.fullHistory ? undefined : summarizeChecks(history, selected);
```

在这个文件的 `runSession` 中，关注传给 `runAgent` 的 `messages` 和 `prepareMessages`。前者给 Runtime 一份完整起点，后者每次模型调用前从完整历史派生本轮输入。即使自动策略在追问时省略了 `check_partial` 的原文，下一轮仍可从完整历史生成摘要。

::: details 完整文件 session/run.ts
<<< @/snippets/23-task-follow-up/apps/coding-cli/src/session/run.ts
:::

打开 `apps/coding-cli/src/main.ts`，增加 `import type { RunInputOptions } from './types/task';`，并把 `RunEventListener` 加入现有的 Runtime 类型导入。在 `runCli` 参数列表末尾加 `fullHistory = false,`，给观察脚本保留全量对照入口。

在 `runCli` 中，从第 22 篇的 `const result = await runSession(...)` 开始，替换那次调用的整个语句，保留下方的 `return await reportSession(task, session, result);`：

```ts
    const onEvent: RunEventListener = (event) => {
      printProgress(event);
      if (
        event.type === 'tool_end' &&
        event.toolName === 'update_plan' &&
        !event.isError &&
        session?.plan
      ) {
        printBlock('任务计划（模型声明）', session.plan.read());
      }
    };

    const first = await runSession(task, session, callModel, controller.signal, onEvent, { fullHistory });
    let result = first;

    // 【新增】沿用已经准备的副本和工具，只给 Runtime 一个新的历史起点。
    if (options.followUp && first.status === 'answered' && !controller.signal.aborted) {
      printBlock('首段停止', {
        status: first.status,
        modelCalls: first.modelCalls,
        toolCalls: first.toolCalls,
        runId: first.runId,
      });
      const nextInput: RunInputOptions = {
        messages: [...first.messages, { role: 'user', content: options.followUp }],
        fullHistory,
      };
      result = await runSession(task, session, callModel, controller.signal, onEvent, nextInput);
    }
```

这里把原先传给 `runSession` 的事件回调提成 `onEvent`，供两段共用。首段正常回答、传了追问且没有取消时，才进入第二段。

用固定示例对照。`first.messages` 有 11 条，包括最初的任务、三个请求与反馈批次以及首段回答。数组展开后追加一个 `user`，`nextInput.messages` 就有 12 条，最后一条正是追问。两次调用拿到的是同一个 `session`，所以第二段仍能访问已经修好的文件。最后 `reportSession` 收到第二段结果和这个 `session`，一次性报告累积历史，并重新查看当前副本与验收是否匹配。

::: details 完整文件 apps/coding-cli/src/main.ts
<<< @/snippets/23-task-follow-up/apps/coding-cli/src/main.ts
:::

参考 Pi 的 `Agent.prompt` 怎样把新消息和已有上下文快照一起交给循环。本篇在 CLI 持有工作副本，并利用现有 Runtime 的初始消息参数完成接续。 [Pi 固定版本的 prompt 与快照](https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/agent/src/agent.ts#L349)

## 第四步：在同一个问题上比较两种输入

新建 `examples/task-follow-up/main.ts`。它让两组都运行同一个配置、同一套固定修复动作和同一句追问。每次调用前累计 `context.messages` 的字节数。追问那一轮，固定回调从 `readFailure` 取得旧失败的来源，再确认 `check_complete` 确实通过。找不到依据就报错。

::: details 完整示例 examples/task-follow-up/main.ts
<<< @/snippets/23-task-follow-up/examples/task-follow-up/main.ts
:::

想看两组差异，先在这个文件里找到 `readFailure`。全量模式走函数的第一个分支。它在本轮消息中找到 `check_partial`，从外层工具结果的 `stdout` 解析用例报告，取得第一条失败用例的 `input`。自动模式走第二个分支。它读第 21 篇生成的摘要，从 `omitted` 核对请求 ID 和 `failedInput`。两条路最后都得到 `input: '/'`，`source` 则会告诉你走了哪条路。

```bash
npm run check
node --import tsx examples/task-follow-up/main.ts managed
node --import tsx examples/task-follow-up/main.ts full
```

先找 `首段停止`。它的运行 ID 与后面的追问运行不同，前面的「工作副本」只打印一次。自动策略的追问开始时历史有 12 条，准备后给模型 8 条。接着看 `追问证据` 和最后的 `模型输入对照`。

| 观察项 | 自动策略 managed | 全量历史 full |
|---|---|---|
| 旧失败的依据 | 验收摘要里的 `check_partial` | `check_partial` 原始反馈 |
| 失败用例与最终验收 | `/`，最终通过 | `/`，最终通过 |
| 模型调用数，两段合计 | 5 | 5 |
| 追问阶段消息字节 | 3,204 | 5,389 |
| 所有调用的消息字节合计 | 11,423 | 15,793 |
| 当前副本交付 | `accepted: true` | `accepted: true` |

字节数来自项目消息数组的 UTF-8 序列化。它们随材料和消息内容变化。表里的五次调用来自观察回调计数，其中首段四次、追问段一次。末尾「运行停止」里的计数只属于最后一段。固定对照验证了证据送达和实际文件验收，真实模型能否据此回答还需要观察。

### 断点：同一个旧失败经过了哪条路

用 `node --inspect-brk --import tsx examples/task-follow-up/main.ts managed` 启动并连接调试器。在 `apps/coding-cli/src/main.ts` 的第二次 `runSession` 调用前查看 `nextInput.messages`，此时仍有 `check_partial` 原始反馈。接着断到 `examples/task-follow-up/main.ts` 的 `readFailure`，检查传入的数组。自动策略的数组里可以找到摘要，换成 `full` 后则会先命中原始反馈。

### 可逆故障：让自动组缺少摘要

在隔离副本的 `apps/coding-cli/src/session/run.ts` 中，把 `prepareMessages` 里的 `summary` 临时设为 `undefined`，保留其余选择逻辑。分别再跑两个对照。自动组预期在追问时失败，因为旧原文和摘要都没进入模型输入。全量组依然能从原文回答。实验后恢复 `summary`。这一步可以定位是输入丢了证据，还是工作副本的验收失败。

### 可选：用真实模型复跑同一对照

按第 19 篇配置好服务后，可以用正常 CLI 传入自己的追问。先执行第四步的构建。下面的命令会请求模型，可能产生费用。

```bash
node --env-file=.env apps/coding-cli/dist/cli.js \
  --task fixtures/code-tasks/route-memory.json \
  --follow-up '第一次验收是哪个用例失败？请给出当前运行的依据。'
```

如果要比较自动策略和全量历史，用下面的观察入口。两条命令都使用同一份任务配置和问题，每次创建一份独立工作副本。

```bash
node --env-file=.env --import tsx examples/task-follow-up/main.ts managed --live
node --env-file=.env --import tsx examples/task-follow-up/main.ts full --live
```

先比两份报告里的实际验收和追问依据，再比调用数和消息字节。如果模型一次就修好了，历史里可能从未出现失败验收。此时合理的追问回答是说明没有失败记录。把这种实际行为记下来即可。作者验证使用固定模型和真实本地工具。

## 保存本篇

```bash
git status --short
git add apps/coding-cli/src examples/task-follow-up
git commit -F - <<'EOF_COMMIT'
在同一工作副本上接续用户追问

保留首段完整历史并追加追问，输入裁剪时保留最新用户消息。
用同一任务比较全量和自动输入策略的证据与消息规模。
EOF_COMMIT
git push -u origin agent/chapter-23-task-follow-up
```
