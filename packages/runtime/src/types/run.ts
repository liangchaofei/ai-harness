// 一次运行的配置与停止结果。
import type { AssistantMessage, Message } from '@ai-harness/model';
import type { ModelCall } from './model-call';
import type { RunFailure } from './failures';
import type { ExecutableTool } from './tools';
// 应用可以接收本次运行的动作通知。
import type { RunEventListener } from './events';

/** 应用创建运行配置；任务与模型连接不写入通用循环。 */
export interface RunAgentOptions {
  /** 初始记录；Runtime 复制数组后追加，不向此数组 push。 */
  messages: readonly Message[];
  /** 可省略的总体要求，每次模型调用沿用。 */
  systemPrompt?: string;
  /** 本次允许使用的本地工具；Runtime 仅把说明交给 callModel。 */
  tools: readonly ExecutableTool[];
  /** 应用绑定服务配置和凭据的函数，Runtime 不选择提供商。 */
  callModel: ModelCall;
  /** 整次运行最多发起的模型调用数，正安全整数；包括最终回答和失败的调用。 */
  maxModelCalls: number;
  // 不提供时仍按原循环运行。
  /** 可选观察函数；被依次等待，失败被计数；返回值不改变状态。取消须由应用另行触发 controller。 */
  onEvent?: RunEventListener;
  // 【新增】应用持有 controller，Runtime 只读取信号。
  /** 触发后停止新动作；等待当前协作操作退出。不会强杀不响应信号的操作。 */
  signal?: AbortSignal;
}

/** 各种停止结果共用的运行记录，由 Runtime 创建并交给应用读取。 */
interface RunRecord {
  /** 已保存的初始消息、模型响应和工具结果；未知批次异常时含此前已完成项，只在内存中。 */
  messages: readonly Message[];
  /** 实际发起的模型调用次数，不是工具次数或消息条数。 */
  modelCalls: number;
}

/** 包内先构造的停止结果；answered 也不保证任务结论正确。 */
export type RunOutcome = RunRecord & (
  | { status: 'answered'; answer: AssistantMessage }
  // 【新增】主动停止，保留已有完整记录；无 answer/failure，不表示可直接恢复。
  | { status: 'cancelled' }
  // callLimit 最后一次仍请求工具；truncated 输出截断；emptyAnswer 正常停止但无文本。
  | { status: 'callLimit' | 'truncated' | 'emptyAnswer' }
  // 未知异常不作为工具反馈；保留原异常仅供本地调试，不能直接打印整个结果。
  | { status: 'failed'; phase: 'model' | 'tools'; failure: RunFailure; error: unknown }
);

// 对外结果附运行身份与观察失败数，原有停止联合保留。
/** Runtime 返回给应用；runId 可与实时事件对齐，观察失败不改变任务停止原因。 */
export type RunResult = RunOutcome & {
  /** 与本次所有事件的 runId 相同，不表示已创建持久化会话。 */
  runId: string;
  /** onEvent 抛错或 Promise 拒绝的次数，包括 run_end；没有监听方时为 0。 */
  observerErrors: number;
};