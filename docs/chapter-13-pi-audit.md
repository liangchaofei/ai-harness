# 13来源核对

实现前读取固定提交8efd314fa3d3232ce197d8d7a6a5660530b9d83e：

- packages/coding-agent/src/core/tools/read.ts，createReadToolDefinition/createReadTool：应用cwd、读取路径、输出限制/offset/limit、多种内容；本章仅小型TS文本全文，不移植图片或分页。
- 同目录find.ts，createFindToolDefinition/createFindTool、relativizeFindResultPath：路径发现与相对结果，真实默认fd，glob/gitignore和结果/字节限制；本章是自有有限索引与路径子串，不冒称glob兼容。
- 同目录grep.ts，createGrepToolDefinition/createGrepTool：内容查找、行号、上下文/截断、默认rg；本章使用有界Node读取和字面量，不实现正则、外部进程管理或通用搜索平台。

源链接：https://github.com/badlogic/pi-mono/tree/8efd314fa3d3232ce197d8d7a6a5660530b9d83e/packages/coding-agent/src/core/tools

第一方Node22文档：https://nodejs.org/docs/latest-v22.x/api/fs.html ，opendir返回可异步迭代目录，for-await退出关闭；lstat检查链接本身、realpath解析路径、filehandle.read和finally关闭、O_NOFOLLOW最终链接限制。目录树动态竞争不能以路径检查宣称已提供OS沙箱。本项目新Workspace/索引限制及有限报告是课程选择，不是Pi等价实现或岗位标准。
