# 第 38 篇验证记录

起点为已提交的第 37 篇。正式 CLI 在任务装配前处理 `--inspect-trace`，借用现有的 Zod 依赖验证第 37 篇已经写出的版本 1 记录。Pi 固定提交 `8efd314fa3d3232ce197d8d7a6a5660530b9d83e` 的 [parseSessionEntries](https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/coding-agent/src/core/session-manager.ts#L355) 是逐行读取的工程参考。

| 验证 | 实际结果 |
| --- | --- |
| 发票额度耗尽原轨迹 | `evidence: 'ended'`，`toolLimit`，最后一批请求 2 项、开始 1 项，`skippedByToolLimit: 1`。 |
| 发票成功原轨迹 | `evidence: 'ended'`，`answered`，无额度归因。交付由原运行报告另行确认。 |
| 去掉结束行并追加半行 | `partialTail: true`、`evidence: 'prefix'`、已观察 12 次开始，无停止结论。 |
| 保留结束但删掉一条开始行 | 已观察 11 次，结束计数 12，`inconsistent`，无额度归因。 |
| 两段轨迹合并 | 两个不同 `runId` 按文件顺序分别输出。 |
| 无效输入 | 损坏完整行、257 KiB 文件、命名管道或混用任务参数均退出 2。 |
| 读写与模型边界 | 诊断前后源文件逐字节相同。注入会抛错的模型工厂，诊断成功且工厂未被调用。 |

工程检查、站点构建和四份教学源码的一致性核对通过。Chromium 桌面和手机宽度可加载五处图解、打开原图链接并展开代码。

原始轨迹用固定响应与实际工作区工具生成。诊断只读证据，没有调用真实模型、恢复执行或重新验收。下一单元再从可诊断性推进到离线任务集与回归。
