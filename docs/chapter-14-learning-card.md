# 14学习卡：让执行结果推动下一步

应用选择副本、可写文件与固定验收，模型选择调用，工具实际执行，Runtime保存ID关联反馈。新能力在coding-tools，model/runtime不改；扩展名可配，旧TS默认不变。

固定演示：读3文件→删掉全部折扣→真实验收100×10得1000而预期900、退出1→失败进Context→改为一次折扣→真实多输入通过、退出0→模型总结。4模型/7工具是固定计划数值，非真实模型成功条件。

toolResult.isError false表示验收工具取得观察，CheckResult.status failed表示业务用例失败；它可以影响下一轮。未知异常与主动取消仍由原Runtime停止，子进程协作清理；已完成rename不会回滚。

精确oldText唯一匹配，写清单比读索引窄；先写临时文件、复读、rename，非CAS/多文件事务。命令固定、无shell、env空、输出8KiB/3秒，仅直接子进程，非OS隔离。生成代码仍有Node权限。

before/after来自实际副本，报告不执行额外验收；readyForReview只是变化和历史通过线索，未绑定最终版本，15继续。原fixtures不自动写回；操作者审阅保留的临时目录。验收脚本是完整配套业务材料，非Agent机制。

断点：副本准备、source/next/rename、spawn/close、Runtime.push、报告before/after/check。可逆故障expected900→901，定位可信规则不一致；迁移阈值20并更新README/用例，不改通用包。独立理解、真实质量与迁移待证。
