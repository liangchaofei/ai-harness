// 【新增文件】示例应用之间共用的任务组装约定，不属于 Runtime 公共协议。
import type { RunAgentOptions, RunResult } from '@ai-harness/runtime';

/** 任务工厂创建，入口使用；模型连接、预算与运行控制仍由入口选择。 */
export interface ExampleTask {
  /** 供日志区分材料案例；不是 Runtime 的运行 ID。 */
  id: string;
  /** 目标、初始消息和工具；不包含模型凭据、观察函数或运行预算。 */
  input: Pick<RunAgentOptions, 'messages' | 'systemPrompt' | 'tools'>;
  /** 停止后展示记录并检查当前任务需要的材料证据；不证明答案语义正确。 */
  report: (result: RunResult) => boolean;
}
