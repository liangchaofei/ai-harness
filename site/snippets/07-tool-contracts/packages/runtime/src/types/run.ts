// 【修改】failed 新增必填 failure，error 仍仅供本地调试。
// 一次运行的配置与停止结果。
import type { AssistantMessage, Message } from '@ai-harness/model';
import type { ModelCall } from './model-call';
import type { RunFailure } from './failures';
import type { ExecutableTool } from './tools';

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
}

/** 各种停止结果共用的运行记录，由 Runtime 创建并交给应用读取。 */
interface RunRecord {
  /** 已保存的初始消息、模型响应和工具结果；未知批次异常时含此前已完成项，只在内存中。 */
  messages: readonly Message[];
  /** 实际发起的模型调用次数，不是工具次数或消息条数。 */
  modelCalls: number;
}

/** Runtime 返回的停止原因；answered 也不保证任务结论正确。 */
export type RunResult = RunRecord & (
  | { status: 'answered'; answer: AssistantMessage }
  // callLimit 最后一次仍请求工具；truncated 输出截断；emptyAnswer 正常停止但无文本。
  | { status: 'callLimit' | 'truncated' | 'emptyAnswer' }
  // 未知异常不作为工具反馈；保留原异常仅供本地调试，不能直接打印整个结果。
  | { status: 'failed'; phase: 'model' | 'tools'; failure: RunFailure; error: unknown }
);
