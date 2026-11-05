# 09 作者验证与交付边界

2026-11-05。起点实际分支agent/chapter-08-runtime-events跟踪同名远程、工作区干净；源码已有08事件与终端排版，不据此认定学习者掌握。助手仅写site/docs/AGENTS，未写学习源码/root配置，未切分支、暂存提交、推送、合并或部署；未读真实.env、未调用模型服务。

## 候选与临时工程

候选site/snippets/09-model-streaming，从08复制并移除旧变化标签；新协议代码进入各provider目录，原非流式入口和旧解码器保留。共87文件，正文全部提供同源核对，114处引用。原工具与两任务材料不改。

临时工程/var/folders/7s/3jb1m_s92z1cr54b6s_b76mc0000gn/T/ai09-stream-qbq8m7vk，指针/tmp/ai09-temp；只在临时根workspaces去掉site，复用已有依赖缓存，不新增依赖。最终npm run check退出0，包含三包构建与所有示例TS检查。候选与临时文件逐字核对（仅临时package.json移除站点这一差异）。

## 流行为与边界

作者verify-stream.mjs（保存在临时工程，初始生成脚本/tmp/ai09-check.mjs；后续断言追加于临时文件）最终159条断言，非159种独立场景：

- 两协议按1/2/7/大块字节发送，跨中文UTF8与CRLF均正确；文字增量拼接等于最终内容，done唯一。
- DeepSeek按index聚合不同工具，支持首次项交错到达后排序；重复ID、最终缺索引、额外结束后内容、思考内容拒绝。Anthropic多文字块保持与旧解码器相同换行，ping不产生内容，缺消息开始、错误块顺序、未知块、事件名不符、未知停止拒绝。
- 人为保持终止标记尚未到达：文字已预览但model_end/execute均未发生；放行终止后才执行一次、历史只有完整消息。检查不把已拼完JSON当可执行许可。
- 第一次流提前结束：模型失败，初始历史不变、无工具执行；第二次流提前结束：保留第一次assistant和成功工具结果，不写第二次半条消息。
- 长度截断且JSON草稿无效：返回length和文本、不交工具草稿。观察异常只计数、不改变任务停止或重复动作。
- 显式服务错误帧为service/model_service，受控信息不含原服务正文；HTTP非成功、连接失败、读取拒绝、无效UTF8、错误Content-Type、字符上限等分别停止。关闭或提前return迭代可观察到reader取消。
- SSE层验证BOM、CR/LF/CRLF、注释、多data合并、空data、无空行尾帧；不是完整EventSource，不重连。

作者检查最初将源码reader的错误类与打包模块错误类作instanceof比较，类副本不同导致断言失败；仅将包内直接调试的断言改按name/kind检查，公共stream路径仍按公共ModelCallError检查。未以改实现掩盖该检查问题。

## 入口、实验与旧能力

/tmp/ai09-integration.py配/tmp/ai09-entry-hook.mjs，hook把旧固定HTTP样本转换为原生SSE，无远程调用：DeepSeek/Anthropic × code-review/release-impact四条真实examples/run.ts路径均answered，原本地工具与应用接受检查参与。服务查询批次仍三项，审查仍一项真实读取，不是复制循环或由固定答案证明自主质量。

两种check-stream正常入口实跑：11事件（原8加3文字预览），2次模型调用；第一次完整请求后才读取；第二次最终文字与片段一致，完整历史4条。固定材料末尾留注释，保证网页复制仍保留终止帧空行，注释本身不变成模型事件。

按正文实跑：
- 两种--interrupt均退出1，保留预览但无model_end/tool_start，model_protocol并停止。
- 在model_text_delta打印后临时throw：answered/2、observerErrors3、真实读取一次；恢复源文件。
- 同一工具参数改为三帧，最终src/cart.ts仍只执行一次；恢复样本。
- 模型包内readSse早期观察命令及仓库根模型流观察命令原样执行，分别得到单帧与text_delta/done。TS导入无扩展名由tsx处理。

07门禁/非流式双协议等51项回归通过；只将已于08改版的日志断言改为modelCalls:3。作者07脚本直接导入TS显示模块，因此执行需--import tsx；首次用裸node发生扩展名解析失败，修正作者运行命令后通过，未改学习代码或教材导入规则。08既有事件166条断言通过（旧ModelCall忽略第二参数仍兼容）。

## 包外消费

/tmp/ai09-consumer.py在独立临时目录安装三个npm pack产物，完全通过公开入口消费stream/ModelStreamEvent/ModelCall/RunEvent。两服务固定SSE、外部自备source.ts真实读取通过；原ID、2次调用、11事件/3片预览、完整历史4项、同runId均核对；TS公开类型消费通过。没有发布npm。最终外部目录：/var/folders/7s/3jb1m_s92z1cr54b6s_b76mc0000gn/T/ai09-consumer-zhvytkp0；指针/tmp/ai09-consumer。

## 网站与源码保护

VitePress构建退出0，只有已有大chunk提示；Waza中文标点检查通过，并人工审查具体值、前后返回与历史保存关系。实际浏览器检查实施前五步、八个实现步骤、93折叠项、3图加载和base路径，无#region。三个SVG均整图渲染检查，双协议与成功/失败是并列关系不误连成顺序；读取器图注明1–4循环、退出才清理。

/tmp/ai09-before.json的72份学习源码/材料/root配置SHA256结束核对未变；原coding-tools与任务材料候选除旧标签外保持08，git diff --check通过。浏览器与本地4174服务供阅读，没有部署。

## 未验证范围

全部为作者固定响应/真实本地I/O的机制证据，没有学习者09独立实现、迁移、延迟复用或真实模型自主审查质量证据。两服务线上Key、真实网络兼容仍需操作者自愿验证。文本/自定义工具、单choice、有限原生事件，非思考/多模态/服务工具或完整兼容层；2Mi字符不是任务token预算。单HTTP30秒、顺序等待观察函数，取消/整次时限/持久化恢复后续建设。

## 09实施途中：提供商目录归组

用户在agent/chapter-09-model-streaming未提交工作区中移动六份已有文件，保留deepseek.ts/anthropic.ts等文件名，放入各自目录。核对当前complete、两入口、请求构造、四编解码相对导入均与新位置相符；当前尚未写stream.ts符合第三步实施位置，不当作遗漏。

当前实际学习源码只读复制到/var/folders/7s/3jb1m_s92z1cr54b6s_b76mc0000gn/T/ai09-folders-current-y9q5xjyr，指针/tmp/ai09-folder-current，npm run check通过。最终候选在原09临时工程同步移动并删除旧路径，check、159流断言与51非流式/门禁回归通过。/tmp/ai09-folder-before.json记录的本次起点学习文件哈希结束未变；模型包相对引用全部解析到实际存在文件，不借旧路径兜底。

正文合并在第三步请求构造之前：六文件移动表、最终目录、四编解码完整核对、complete完整替换、两入口新位置及后续stream导入；不改08及更早快照。87份候选均有完整引用。公共index/exports、Runtime和应用不因目录移动而改变；09其他功能仍按后续步骤实施。无付费调用/真实.env/学习源码写入/Git操作。
