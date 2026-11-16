# 第 44 篇验证记录

起点为已提交的第 43 篇。新增私有 workspace `@ai-harness/harness`，从根入口公开工作区会话、Runtime 循环和交付判断。CLI 迁移到该公开入口，交付函数沿用原算法。参考 Pi 固定提交 `8efd314fa3d3232ce197d8d7a6a5660530b9d83e` 的 [Coding Agent 根入口](https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/coding-agent/src/index.ts)。

| 验证 | 实际结果 |
| --- | --- |
| 外部安装 | 分别构建并打包四个本地 workspace，在仓库外的临时 npm 项目安装。四个安装目录均为普通目录。 |
| 类型与入口 | 外部项目用 TypeScript 5.9.3 的 NodeNext 模式严格编译通过。尝试导入 Harness 内部子路径触发 `ERR_PACKAGE_PATH_NOT_EXPORTED`。 |
| 独立业务交付 | 固定模型将总价计算改为乘法，真实外部验收通过。实际输出 `checkMatchesCurrent: true`、`accepted: true`。 |
| 缺验收对照 | 同样修改和回答，省略验收后 `answered`、`accepted: false`，退出 1。 |
| CLI 回归 | 使用第 37 篇的发票 `room` 场景，实际验收仍通过。 |

工程检查、站点构建和十一份教学文件逐字节核对通过。Chromium 桌面及手机宽度可加载四处图解、打开原图并展开完整代码。

独立安装使用缓存中的第三方依赖，未发布包、未调用真实模型。桌面进程、权限交互和凭据归属属于后续单元。
