// 应用保留同一次运行的任务会话句柄。
import type { CodeTaskRunner, CodeTaskSession } from '@ai-harness/harness';
import type { PlanSession } from '@ai-harness/runtime';

/** prepareSession创建，运行和报告共同使用；没有跨进程恢复能力。 */
export interface CliSession {
  /** 已准备好的独立副本；成功准备后即保留供审阅，包括取消或失败。 */
  root: string;
  /** 工具与inspect共享同一份基线和最近验收来源。 */
  codeTask: CodeTaskSession;
  /** 【新增】绑定同一副本，运行首段和追问，再审阅最后一段。 */
  runner: CodeTaskRunner;
  /** 仅--plan开启时存在；模型声明不替代实际验收。 */
  plan?: PlanSession;
}
