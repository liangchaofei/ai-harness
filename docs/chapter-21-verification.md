# 第 21 篇验证

隔离候选离线安装并通过 npm run check。固定修复经实际文件操作与验收，末轮 4761 → 2501 字节（含摘要），accepted true。
临时断言检查模型收到 check_partial 的根路径失败与 check_complete 的通过；后续写入触发 needsRecheck；无法解析的结果为 unknown；没有省略验收时不生成摘要。没有调用模型服务，没有改学习源码。

参考固定 Pi compaction 的待摘要区与保留区划分；本章不复制其模型摘要或会话存储。

重写后：实际候选类型检查通过。summary / cut-only 使用同一修复动作和同一选中批次；探针只在 cut-only 移除摘要。末轮含摘要 2602 字节，能定位原始失败下标 6、ID check_partial、用例 /，退出 0；仅裁剪探针报告缺依据，退出 1。后续写入产生待重验提示；不可解码为 unknown。未使用模型服务。
