# 第 35 篇验证记录

在已提交的第 34 篇上接入一个固定的 stdio MCP 服务。CLI workspace 锁定 MCP TypeScript SDK 1.32.2 和 Zod 4.6.7。CLI 负责服务生命周期与权限，Runtime 继续执行统一工具接口。

参考资料为 MCP 2025-11-25 的 [工具规范](https://modelcontextprotocol.io/specification/2025-11-25/server/tools) 和 [传输规范](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)，以及 Pi 固定提交 `8efd314fa3d3232ce197d8d7a6a5660530b9d83e` 的 [wrapRegisteredTool](https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/coding-agent/src/core/extensions/wrapper.ts#L17)。

| 验证 | 实际结果 |
| --- | --- |
| `repair` | 六次固定模型响应、五次 Runtime 工具调用。真实子进程返回带折扣条款的规则，随后读取入口和当前实现，仅修改获准发票文件。 |
| 真实交付验收 | 五项全部通过，单价 100、数量 10 的金额为 900，`checkMatchesCurrent: true`、`accepted: true`。 |
| `missing-rule` | 在只读配置内，初次查询得到 `policy_lookup / isError: true`，重试得到 `policy_retry / isError: false`。改动为空，退出 1。 |
| 子进程生命周期 | 按父进程 PID 检查。首段和追问共享唯一服务子进程，`runCli` 返回后该子进程已退出。旧发票配置及预取消时没有启动服务。 |
| 打包清单 | `npm pack --workspace @ai-harness/coding-cli --dry-run` 含 `dist/cli.js` 和 `mcp/invoice-policy.mjs`。 |
| 课程站点 | 工程检查和站点构建通过，十份完整教学代码与实际文件逐字节一致；Chromium 桌面和手机宽度可加载 7 处图解、访问放大链接并展开代码。 |

联调未调用真实模型。外部服务是随项目提供的可信 stdio 样例，未验证实时业务数据、真实模型自主迁移或操作系统隔离。
