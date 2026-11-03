# 03 作者验证记录

日期：2026-11-03。实际工作分支保持agent/chapter-02-tool-requests，未切分支、提交、推送或部署。新增学习能力只写入site/snippets/03-tool-feedback，不覆盖学习源码。

## 环境与检查

候选临时工程：`/var/folders/7s/3jb1m_s92z1cr54b6s_b76mc0000gn/T/ai03-feedback-40c2p2lj`，入口指针`/tmp/ai03-temp`。复制候选，补私有site workspace占位；离线安装固定开发依赖，执行npm run check。model/runtime/coding-tools ESM和d.ts构建、全工程tsc通过。

`node verify.mjs`：36项通过，模型HTTP响应固定，文件系统与入口真实执行。没有调用模型服务；密钥只使用placeholder，不读取真实.env。

覆盖：
- 实际读取cart.ts、完整文本与原请求ID；非法JSON、null、数组、缺path、错误类型、额外字段、未允许路径、__proto__、工厂创建后修改配置等拒绝路径。
- 未注册工具、缺文件ENOENT的安全反馈、不带本机绝对路径；目录拒绝；16KiB刚好允许、16385字节拒绝。
- 两项严格顺序与结果ID顺序；重复ID和重复注册预检查；截断和空请求批次拒绝。
- 未知异常中止后续项；明确ToolExecutionError反馈并继续后续项。
- 两次complete的HTTP正文：第一次system/user；写回后system/user/assistant/tool。原id与tool_call_id相等，真实源码在结果content中；内部stopReason/toolName/execute不进入服务协议。
- complete不自动追加历史；实际教学入口正常退出、坏参数后反馈但审查失败、第二次仍toolUse停止、第一次截断不执行、直接文本缺读取证据停止。

教程第四步Node heredoc从正文提取原样执行：local_01对应真实读取、isError=false，无模型调用。未把固定请求写成模型自主动作。

包外消费：三个包各自npm pack；新建仓库外消费工程，离线安装三个tgz，从公开入口导入complete/executeTools/createReadFileTool并读取该消费工程自己的sample.ts，通过。临时位置`/var/folders/7s/3jb1m_s92z1cr54b6s_b76mc0000gn/T/ai03-consumer-u2ihp1hj`。没有公开npm发布，不由workspace源码相对路径冒充包外消费。

## 网站与图

npm run docs:build通过。服务127.0.0.1:4174已有运行，03路径返回HTTP200。使用实际in-app browser打开03，核对标题、正文代码、34个details块、3张图片均完整加载，页面未显示#region。

三张SVG均实际打开并完整截图审查：具体请求/反馈轨迹、包边界、执行处理顺序。包图改为应用分别调用三个包，避免线性箭头误导为model调用runtime；复核文字不溢出。导航、首页、阶段路线同步。

## 未改写与结论限制

学习源码目录packages/examples/apps/fixtures及根package.json/package-lock.json/tsconfig.json，前后SHA256完全相同；git diff --check通过。候选清除02继承的变化标签，本章步骤与章末文件同源。

本记录证明所列程序机制、构建产物和网页表现。未执行真实模型任务，未证明模型必然两次收敛、审查内容正确或学习者掌握。清单是可信应用选择的文件映射，不是OS沙箱；没有并发、回滚、跨批次去重、持久化、恢复、自动循环或完整schema引擎。04继续建设循环，后续阶段补齐可靠控制与工作区能力。

正文顺序修订：开头先展示fixtures/code-review/src/cart.ts完整材料并说明CartItem/price/quantity/total，再讲计算问题；明确此处先读、第四步再创建，以及模型可见路径与磁盘材料的映射关系。实现与命令未变。

构建顺序修订：学习者反馈coding-tools首次导入@ai-harness/runtime时报TS模块缺失。只读检查实际工程：workspace符号链接存在，runtime/dist未生成。正文在Runtime入口完成后、文件工具首次导入前增加Runtime单包构建；同类检查发现示例首次导入coding-tools也早于构建，故在coding-tools入口完成后增加单包构建。临时工程删除这两个包的构建目录，通过TypeScript resolveModuleName复现各自UNRESOLVED；按新增命令逐个构建后分别解析至dist/index.d.ts。只改教程顺序，不修改学习者源码或包配置。
