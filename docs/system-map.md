# 累计系统职责图

2026-11-05：实际学习源码已含09；10为已提供候选，学习者理解、迁移与延迟复用待取证。规划和实现、作者验证分别记录。

```text
应用目标 / systemPrompt / 初始messages / 工具 / 接入配置
  → 07：检查工具清单、复制schema、编译同步参数校验器
  → runAgent持有本次messages、modelCalls
  → callModel(Context)
      → model.complete（06：按provider分发；07：失败分类）
      → 请求编码 → HTTP → 响应解码 → 项目AssistantMessage
  → Runtime保存assistant
      → stop / length / 上限 / 异常：RunResult → 应用接受与语义检查
      → toolUse：executeToolBatch → 名称/JSON/schema检查 → 具体工具语义检查与执行
          → ToolResultMessage关联原ID
          → Runtime保存整批结果 → 下一次Context
```

model定义模型输入输出契约，适配器认识服务协议；Runtime创建并保存运行状态；coding-tools提供受限代码I/O；examples选择任务、工具、配置与接受条件；fixtures提供材料。核心不反向导入示例、材料或UI。

06本地协议观察：固定fetch响应替代网络；请求编码、解码、Runtime和文件读取都实际运行。预写请求与答案不证明自主任务能力；真实服务与学习者掌握分别记录。

后续：阶段二事件/流式/取消/预算；三代码修改与验证、CLI；四上下文与记忆；五持久化恢复；六权限/扩展/人工介入；七评估与编排；八包接口收敛与桌面。计划按任务需要引入，不把每任务写计划设为强制。

07已知工具失败保存为code/message文本的结果并继续；未知异常返回RunResult.failure及仅本地调试error。ToolBatchError带回已完成结果，Runtime保存后停止，不补造出错项成功记录，不执行剩余动作，也不把不完整批次直接当作可恢复历史。providers/shared只共用HTTP等待，协议编解码仍各自负责。

08观察支线（候选）：runAgent的开始/模型调用/停止位置，及executeToolBatch单项处理位置 → events.emit → 本次runId与递增sequence → onEvent → 应用打印/未来界面。只传摘要原始值，不传messages可写引用。tool_end先于整批回到循环的messages.push，不能当作已保存全批。最终finish发run_end后返回RunResult，附同一runId与observerErrors。观察异常不改变停止状态或触发重试；顺序await有慢监听阻塞边界。09才接模型增量。

09候选：应用ModelCall → model.stream → provider请求(stream:true) → HTTP响应头 → readSse字节/UTF8/行/帧 → 服务局部草稿。文字分片→共享stream-model→Runtime的model_text_delta→应用printEvent；完整终止→done.message→ModelCall返回→Runtime.messages.push→原工具门禁/执行/反馈。流失败没有done，预览不写历史、不执行草稿；截断只保留文本/length。非流式complete继续共用请求构造。新增职责不进入任务工具。

10候选控制支路：应用Ctrl+C/按钮 → controller.abort → runAgent.signal → ModelCall第三signal → shared/stream-model → model options.signal → provider HTTP合并信号；同一运行信号进入executeToolBatch第四参数→tool.execute第二参数→具体协作等待/有界文件读取。Runtime等待结束后门禁拒绝迟到结果；取消批次只带此前results，循环push后finish(cancelled)。model_cancelled/tool_cancelled是观察事件，无当前反馈就不补造；两入口finally移除SIGINT监听。无强杀/回滚/恢复，下一单元期限复用信号链。
