# 第 46 篇验证记录

起点为已提交的第 45 篇。新增 Electron 45.3.3 workspace，主进程消费 Harness 的公开运行接口。渲染器通过 preload 获得固定的开始、取消与进度操作。工程参考为 [Electron IPC](https://www.electronjs.org/docs/latest/tutorial/ipc) 和 Pi 固定提交 `8efd314fa3d3232ce197d8d7a6a5660530b9d83e` 的 [RPC 模式](https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/coding-agent/src/modes/rpc/rpc-mode.ts#L353)。

| 验证 | 实际结果 |
| --- | --- |
| 原生窗口 | 启动已构建的 Electron 主进程。页面看到三个固定桥接操作，`window.require` 不可用。 |
| 正常任务 | 从窗口点击运行，看到修改和验收事件，`total.mjs` 通过两项实际验收，状态显示「已接受」。 |
| 重复开始 | 活动任务期间绕开按钮调用开始，主进程拒绝重复执行。 |
| 修改后取消 | 窗口显示「已取消」和已变更的 `total.mjs`。验收栏显示「无」，没有验收完成事件。 |
| 活动期间关窗 | 应用取消、清理临时副本并退出 0。测试前后临时副本目录集合一致。 |
| 类型、教程与网站 | 工程检查、桌面构建、站点构建通过，十一份教学文件与实际源码一致。Chromium 在桌面和手机宽度加载图解、截图和代码折叠。 |

初次窗口联调排除了两处启动问题。主进程保留 Electron 的运行时导入，窗口创建通过 ready 回调启动。最终原生联调使用修正后的构建产物。npm 审计仍报告现有 esbuild、Vite 和 VitePress 开发依赖告警，本篇锁文件未升级这些依赖。

本章用固定模型响应验证真实工具和原生窗口。真实模型、可选择任务、交互式批准以及桌面凭据管理属于后续单元。
