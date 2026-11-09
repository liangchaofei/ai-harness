# 12 固定源码与产物核对

设计前实际读取Pi固定8efd314fa3d3232ce197d8d7a6a5660530b9d83e的packages/agent/src/agent-loop.ts：runLoop接模型响应再处理工具并保存结果；streamAssistantResponse处理模型消息转换和信号；executeToolCallsSequential逐项执行、发送事件、累计结果并检查信号。本地/tmp/ai03-pi/agent-loop.ts与固定远程均读取。
来源：https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/agent/src/agent-loop.ts

本篇不声称新增Pi能力或复制其任务接口，只用该职责边界检查课程内核不包含invoice/release等任务常量。任务工厂与ExampleTask是本项目示例侧约定，材料验收不是模型协议，固定原生SSE是教学装置而不是第二种模型实现。核心保持11。

第一方实际打开npm pack文档：https://docs.npmjs.com/cli/v11/commands/npm-pack/ 。pack在本地创建tarball，pack-destination指定位置；不是publish。不把本地包能安装推断为公开发布、稳定SDK兼容或生产成熟。

2026-11-09继续时重新打开上述固定版本远程源码，按函数名称核对消息保存、模型转换与逐项执行；旧临时源码已被系统清理，不再以其本地行号定位。Pi还包含并行等额外机制，本篇没有照搬，固定装置也不使用其实现。
