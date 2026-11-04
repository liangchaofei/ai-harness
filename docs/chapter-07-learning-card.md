# 07 复习卡：工具准入与失败

目标：模型可以提出动作，Runtime在进入execute前统一检查声明和参数；已知失败成为后续信息，未知异常明确停止。

先用行为理解，不背错误类：应用给规则与执行函数→Runtime把规则编译成检查函数→只处理模型本次提出的请求→结构合格才进入工具→结果保存后进入下一次输入，或停止交给应用。旧工具已有自己的检查，本章补统一入口，未增加新业务任务。

- tools是可选清单，registry是准备后的查找表，message.toolCalls才是本次待处理请求。准备清单不执行工具；批次按一条响应划分，不按工具名划分。
- ExecutableTool由工具工厂创建，提供parameters/execute；RegisteredTool由createToolRegistry实际创建，增加validate。类型本身不编译，应用不必为每个工具接Ajv。


- 启动createToolRegistry：检查名称/重名/执行函数，复制schema，Ajv编译一次。配置错误tool_configuration，模型调用数0。schema来自可信应用，不接受模型自写schema。
- executeToolBatch：整批ID预检→逐项查名→JSON.parse→validate→execute。结构失败invalid_arguments且零工具执行；路径不允许则结构可通过，由工具返回tool_failure。
- ToolExecutionError保留旧构造用法，code默认tool_failure；反馈content是code/message的JSON文本，消息结构和原请求ID不变。已知失败不停止同批其余项。
- ToolBatchError不是可继续的反馈。未知异常带completedResults，runAgent先保存此前结果再failed；后项不调用，出错项副作用未知，没有回滚/恢复。
- ModelCallError区分configuration/http/transport/protocol；complete的return await使异步异常进入当前catch。模型错误不给toolResult，Runtime返回model_...；自定义回调未知异常model_unknown。
- RunResult.failure给应用看，error/cause只留本地断点。稳定类别不等于自动重试策略。status/phase/failure.code含义不同。
- 原executeTools/tool-error移入tools/execute与errors/tool-execution-error，公共包名/函数名不变；类型归types。旧两个根文件删除，不能留两份实现。

本地观察check-tool-contract：预写坏参数→修正→文字，仍使用真实文件工具；不是模型自主表现。06协议观察检验另一层，两者不能互相代替。

迁移：只把第一项123换成src/missing.ts，解释为何从invalid_arguments变成tool_failure，再恢复。后续事件章隔一单元回忆失败消费者与部分结果归属；无学习者独立表现，不判断掌握。
