# 10 设计前源码与第一方核对

固定 Pi：8efd314fa3d3232ce197d8d7a6a5660530b9d83e。
实际读取 packages/agent/src/agent-loop.ts：runLoop、streamAssistantResponse（384起）、executeToolCallsSequential（530起）；本地核对副本/tmp/ai03-pi/agent-loop.ts，并打开远程固定内容。
- streamAssistantResponse 将 signal 传给 streamFunction。
- executeToolCallsSequential 将 signal 传给 prepareToolCall/executePreparedToolCall，执行并完成一项后检查 signal.aborted，给剩余项取消结果。
- runLoop 识别 error/aborted 消息后停止。
来源：https://github.com/badlogic/pi-mono/blob/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/agent/src/agent-loop.ts

本项目借鉴取消沿调用链传递及停止剩余项；自己的策略：不保存预览、丢弃当前迟到结果、不补未执行项toolResult，取消返回专门RunResult；等待不协作操作真正返回，不用race宣称底层已停。不等价于Pi的partial/取消补齐/恢复。

第一方实际打开Node globals（2026-11-05）：AbortController.abort、signal.aborted/reason/throwIfAborted、AbortSignal.any、timeout；any由任意输入触发，reason来自首次触发者。原生signal不是强杀任意JS函数。https://nodejs.org/api/globals.html#class-abortcontroller
尝试Node22文档链接本工具不可达；项目已有Node>=22，any在20.3/18.17已加入（globals版本历史），不引入新版本要求。

Node timers取消章节已实际打开：https://nodejs.org/api/timers.html#cancelling-timers ，Promises计时可接收signal并因取消拒绝；示例中的20/100/200ms均为观察时机，不是Runtime期限策略。
