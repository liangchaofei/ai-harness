# 第02篇：模型提出工具请求

阶段一、JD工具契约与动作选择。01已提供且当前源码存在；用户表示阅读尚可，不认定掌握。实际分支main跟踪origin/main，工作区干净。助手不切分支，不改学习源码或读取真实.env。

目标：同一complete公开入口接收工具说明，保留模型返回的一到多项请求，应用区分文本、待执行与截断。无工具执行、tool结果、自动循环、Runtime包、权限或恢复。

设计选择：延续纯文本content，增加ToolDefinition、ToolCall、Context.tools和AssistantMessage.toolCalls，finish_reason映射stop/length/toolUse。参数保留服务原始字符串；不同于Pi已解析参数与内容块，下一章执行前再解析与校验。不是自行写一个动作JSON冒充模型协议。

职责：messages/tools/context/options分别定义契约，validation保留通用判断；providers/deepseek-response.ts承接从deepseek移出的解码与多请求检查，deepseek负责请求与工具说明转换；应用tools.ts仅声明read_file，无读取实现；main只观察返回。工具参数schema提供描述，不充当本地授权或校验。

步骤：
- [x] 固定Pi源码与第一方协议核对，记录行为和差异。
- [x] 候选扩展类型、解码、请求与应用，复用01配置。
- [x] 临时工程构建/类型与固定响应行为验证，不发付费请求。
- [x] 正文按具体场景和数据轨迹分步编写；同源完整代码、断点、故障与迁移、中文commit/push。
- [x] 系统位置/响应处理图渲染、导航路线状态更新、网站构建和网页检查。

正常证据：工具说明进入HTTP正文；null内容及多项请求转换；ID、名称、原始参数完整保留。失败证据：错误协议、缺ID、重ID、非法停止原因、截断不当成功；参数非JSON仍只展示不执行。文本路径兼容01。学习源码哈希不变。

按用户要求自02落实类型职责拆分：创建messages.ts、tools.ts、context.ts、options.ts，替代01的types.ts。同步提供商导入和index导出，公开接口不变；后续章节遵循该组织方式。

类型目录定为packages/model/src/types/，四个职责文件置于其中，模型包公开index逐文件导出，提供商从../types/具体文件导入。示例tools.ts是工具声明值，仍在示例目录，不能误移到类型目录。

最终教学起点调整：01直接创建types/messages.ts、context.ts、options.ts；02不再迁移类型目录，仅新增types/tools.ts并替换messages/context。删除旧types.ts的中间教学说明已从正文移除，不要求读者重抄未改的options。
