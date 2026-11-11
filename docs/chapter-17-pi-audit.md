# 17来源核对

设计前读取Pi固定提交8efd314fa3d3232ce197d8d7a6a5660530b9d83e的：

- packages/coding-agent/src/cli.ts：shebang，setupCli后main(process.argv.slice(2))，薄可执行入口。
- packages/coding-agent/src/main.ts：主入口配置与session创建、模式分发。未把全部938行机制搬入当前教材。
- packages/coding-agent/src/modes/print-mode.ts：runPrintMode，session.prompt，订阅观察，完整结果选择，返回退出码，finally释放监听与runtime并刷新输出。Pi还包含会话/扩展/信号与多模式资源管理，本篇只借鉴应用组合与退出后清理的职责。

https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/coding-agent/src/cli.ts
https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/coding-agent/src/main.ts
https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/coding-agent/src/modes/print-mode.ts

2026-11-10核对npm官方package-json/bin：bin字段指向文件，安装建立命令链接，脚本需要Node shebang。临时实际观察：第一次安装尚无dist目标时没有命令链接；先构建再npm rebuild该workspace后，npm exec --offline可用。
https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#bin

本课程选择四字段可信任务JSON、仅无依赖ESM材料、外置固定验收、独立副本、6/8/60s及退出码0/1/2/130。非Pi等价接口，不以包名/目录/打包成功证明生产成熟性。暂不提取通用harness包，不让应用导入示例。
