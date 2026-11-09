# 14来源核对

设计前读取固定8efd314fa3d3232ce197d8d7a6a5660530b9d83e：

- coding-agent/src/core/tools/edit.ts：createEditToolDefinition，oldText唯一精确替换、路径与操作、diff反馈。Pi还含多块修改、行尾处理、队列，本章不等价。
- coding-agent/src/core/tools/bash.ts：createLocalShellOperations/createBashToolDefinition，cwd/spawn/signal、进程树与输出。课程仅固定命令、不经shell、不继承环境、管理直接子进程，不是Pi执行层或OS沙箱。

https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/coding-agent/src/core/tools/edit.ts
https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/coding-agent/src/core/tools/bash.ts

Node官方：https://nodejs.org/api/child_process.html ，spawn的cwd/env/stdio/shell选项、close和kill。
Node22文件系统：https://nodejs.org/docs/latest-v22.x/api/fs.html ，open wx、rename、cp/mkdtemp。

限定命令不限制被执行源码的Node权限；路径复查和rename不防恶意并发替换，不提供事务回滚。副本生命周期、可写范围与readyForReview是课程选择，不声称参考项目有同名接口或验收即生产就绪。
