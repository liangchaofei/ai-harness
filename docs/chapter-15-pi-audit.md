# 15知识来源与Pi核对

设计前读取固定提交8efd314fa3d3232ce197d8d7a6a5660530b9d83e：

- packages/coding-agent/src/core/tools/edit.ts，createEditToolDefinition：withFileMutationQueue内读取/转换/写入，generateDiffString/generateUnifiedPatch后返回details.diff/patch/firstChangedLine。
- packages/coding-agent/src/core/tools/edit-diff.ts，generateDiffString：Diff.diffLines、行号/上下文；computeEditsDiff读取后生成预览。正文借鉴实际变更可审阅，不称本章before/after为其算法或patch。

https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/coding-agent/src/core/tools/edit.ts
https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/coding-agent/src/core/tools/edit-diff.ts

Node官方createHash/update/digest：https://nodejs.org/docs/latest-v22.x/api/crypto.html#cryptocreatehashalgorithm-options 。采用sha256对JSON路径/全文序列计算内容摘要；不是签名或正确性证明。

会话、CheckEvidence、inspect和acceptRepair为课程自身选择。没有从Pi推断同名完成协议；固定路径范围、前后采集不是原子快照/操作系统隔离，不覆盖外部依赖和验收代码变化。脚本/命令可信稳定、无并发写入为明确前提。
