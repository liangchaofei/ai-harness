# 累计系统职责图

2026-11-04：实际学习源码已到05；06为已提供候选，尚未收集学习者实现证据。规划和已有实现分开。

```text
应用目标 / systemPrompt / 初始messages / 工具 / 接入配置
  → runAgent持有本次messages、modelCalls
  → callModel(Context)
      → model.complete（06候选：按provider分发）
      → 请求编码 → HTTP → 响应解码 → 项目AssistantMessage
  → Runtime保存assistant
      → stop / length / 上限 / 异常：RunResult → 应用接受与语义检查
      → toolUse：executeTools → 具体工具实际执行
          → ToolResultMessage关联原ID
          → Runtime保存整批结果 → 下一次Context
```

model定义模型输入输出契约，适配器认识服务协议；Runtime创建并保存运行状态；coding-tools提供受限代码I/O；examples选择任务、工具、配置与接受条件；fixtures提供材料。核心不反向导入示例、材料或UI。

06本地协议观察：固定fetch响应替代网络；请求编码、解码、Runtime和文件读取都实际运行。预写请求与答案不证明自主任务能力；真实服务与学习者掌握分别记录。

后续：阶段二事件/流式/取消/预算；三代码修改与验证、CLI；四上下文与记忆；五持久化恢复；六权限/扩展/人工介入；七评估与编排；八包接口收敛与桌面。计划按任务需要引入，不把每任务写计划设为强制。
