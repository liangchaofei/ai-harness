# 07 Pi与校验库来源核对

固定Pi提交8efd314fa3d3232ce197d8d7a6a5660530b9d83e。设计前读取/tmp/ai03-pi/agent-loop.ts的prepareToolCall（约710起），并下载读取packages/ai/src/utils/validation.ts至/tmp/ai07-pi-validation.ts。

prepareToolCall按工具名查找，再调用prepareToolCallArguments/validateToolArguments，才进入执行接线。validateToolArguments复制参数，处理可选null和转换，getValidator用WeakMap缓存TypeBox Compile的检查函数，再Check；失败说明包含原参数。课程不把Pi当前采用的库误写成Ajv，也不直接照搬其类型转换、null策略或原参数错误输出。

课程选择：此前普通JSON Schema继续由Runtime统一接线，使用Ajv8.20.0，2026-11-04 npm view ajv version确认；strict:true，不启用coerceTypes/useDefaults/removeAdditional。每次运行复制schema/编译一次，运行内复用Map；不引入动态插件、远程ref或异步schema，不从模型/未信任材料编译代码。

第一方核对：
- https://ajv.js.org/guide/getting-started.html ：compile把schema转换为函数；建议编译后复用，非每次请求重编译。
- https://ajv.js.org/options.html ：strict、addUsedSchema及数据修改选项默认值。库导入与ValidateFunction类型通过实际TS构建验证。

ModelCallError/RunFailure类别、ToolBatchError携带部分结果、目录归组与错误反馈code/message是本项目当前设计，并非Pi原API。只保证已验证路径，不据引用声称生产可靠性或掌握。API06现有协议不变，本章只把共同HTTP等待与错误归类收敛；未执行付费模型请求。
