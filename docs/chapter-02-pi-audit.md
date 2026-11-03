# 第02篇来源核对（2026-11-03）

固定Pi提交8efd314fa3d3232ce197d8d7a6a5660530b9d83e，设计候选前实际阅读：types.ts 436–448 ToolCall、754–775 Tool/Context；api/openai-completions.ts 615–705工具流式增量、1484–1521 convertTools、1564–1577 mapStopReason。

借鉴：声明进入输入；请求有ID/名称/参数；一条消息可含多个请求；服务工具字段转换为项目结构。差异：Pi内容块、已解析JsonObject、argumentsError及流式累积，本篇非流式、纯文本加数组、参数原始字符串；不照搬提供商集合、完整消息类型或执行层。

第一方协议：实际读取 https://api-docs.deepseek.com/api/create-chat-completion/ 的tools、tool_choice、响应content、tool_calls、function.arguments和finish_reason。确认可有多项请求、content可null、参数是字符串且执行前需本地检查。本篇不设强制tool_choice；function_calling旧路径已重定向首页，不作为工具机制出处。

当前文件快照SHA256：
- types.ts: 258627828297eb0165de9828cab62666265a77e932dea5dba1542ace9c47c7d5
- api/openai-completions.ts: 8e2b66ed66600e38ab03d12a68338ace5ea0515810a9d1670bd9177f82556465
