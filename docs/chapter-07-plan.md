# 07 工具准入与可判断的失败

2026-11-04，起点实际分支agent/chapter-06-model-providers，跟踪同名远程、工作区干净；实际model已包含06，Runtime仍为04/05实现。用户要求后续按职责使用目录归组，不现在重排旧providers。遵守：新runtime/tools与errors、model/errors、providers/shared；不创建每函数一文件的空层，不改旧提供商目录。

阶段二JD主线：Tool参数校验、运行失败分类与可靠状态。能力契约：可信应用注入工具，启动前拒绝歧义/无效schema；模型参数在execute前校验，结构错误以稳定代码回传，未知异常停止并保留批次已完成结果；应用按稳定失败代码判断，不解析任意异常正文。schema不等于授权，工具继续保留清单和语义检查。

设计前读取Pi固定8efd314的prepareToolCall以及packages/ai/src/utils/validation.ts的validateToolArguments/getValidator。Pi实际使用TypeBox Compile及缓存，包含转换/可选null策略；课程采用Ajv8.20.0处理已使用的普通JSON Schema，关闭数据修改默认行为、不照搬转换或错误原参数输出。第一方Ajv getting-started/options核对编译复用、strict与默认不转换不补值不移除字段。

工具清单每次runAgent编译一次，schema深拷贝，本次公开说明和执行校验取同一份快照；工具execute绑定原对象以保留this，不宣称闭包状态被隔离。不公开注册表作为动态插件框架，不支持异步schema/远程ref。清单来自可信代码，不从模型或未审批外部内容编译schema。

原executeTools/tool-error迁至tools/execute与errors/tool-execution-error，公开名称保留；executeTools独立调用仍检查清单，runAgent调用内部executeToolBatch复用注册表。已知失败content改为code/message的JSON文本，公共消息结构不变。未知ToolBatchError带completedResults和cause，Runtime保存已完成结果后failed，不能推断出错工具无副作用，无回滚/重试/恢复。

模型包新增ModelCallError分类configuration/http/transport/protocol；两家HTTP等待共同抽入providers/shared/request-json，保留原编解码；complete中await确保异步转换异常可分类。Runtime只读公共错误类型，未知注入模型错误为model_unknown；失败RunResult增加受控failure和本地error。配置/服务失败不伪装成toolResult。printRun显示稳定代码与安全说明，旧诊断保留。

实现顺序：模型失败边界→工具契约/依赖/清单→批次执行→循环与结果→应用展示→本地固定坏参数后修正路径→两原任务及双适配回归。普通文件/目录选择已获授权，不重复确认。

作者在临时工程验证：Ajv坏输入零I/O、清单失效零模型调用、已知失败可反馈、未知中断有部分结果且不再执行后项；配置/HTTP/连接/协议分类及隐私；两模型两任务、包外消费、正文命令/故障。无付费请求/真实.env。候选同源完整文件、图实际渲染、导航/大纲/学习记录同步。用户学习源码/root配置不覆盖，不切分支提交推送部署。

## 阅读反馈后的表达修订

不改变实现范围和依赖写入顺序。重组章首与局部讲解：旧工具已有检查，新增的是Runtime统一接线；在类型前解释准备前后的对象及实际创建函数；在批次执行前区分tools/registry/toolCalls及同批参数已确定；把失败JSON放到创建处，分类速查放到展示处。错误类服务于反馈/停止行为，不能替代功能讲解。保持全部代码围栏、命令和同源引用内容不变，仅修正文与复习记录，验证页面与构建。
