# 新仓库准备记录

授权：在ai-harness新仓库建设课程，使用VitePress，网站搭建不写进教程。

本次仅准备根workspace、site私有包、网站导读、课程设计、JD映射、学习记录与AGENTS；没有复制旧src/fixtures/章节，没有开始Agent候选实现。

使用npm workspaces，依赖锁定VitePress 1.6.4，避免直接采用2.0预发布版本。base=/ai-harness/，cleanUrls=true；旧站占用4173，新站使用4174。没有修改SSH全局配置、安装全局包或设置远程部署。

实际检查：npm安装127个依赖，package-lock已生成；npm ls --workspaces --depth=0确认site私有workspace及VitePress 1.6.4。初次安装未完成、离线缓存缺少依赖；停止失败安装并清理本次生成的node_modules后，以命令级7897代理成功安装，未修改全局代理。

npm run docs:build通过，git diff --check通过。npm run docs:dev持续监听127.0.0.1:4174；浏览器实际检查首页排版、路线八行表格、学习方式标题和导航，base路径正常。没有正式章节或Agent实现，所以没有声称通过Agent类型检查或行为验证。

Git仍为main、无提交，新增文件未暂存；没有提交推送或部署。旧仓库与4173服务未修改。
