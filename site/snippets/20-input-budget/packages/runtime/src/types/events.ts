// Runtime 发出的动作摘要；应用接收，不参与模型消息协议。
import type { AssistantMessage } from '@ai-harness/model';
import type { RunFailureCode } from './failures';

/** 单项通知沿用原请求身份；执行器填入，不另外生成模型请求 ID。 */
interface ToolIdentity {
  /** 原 assistant.toolCalls 中该项的 id。 */
  toolCallId: string;
  /** 原请求的工具名，即使没有注册该名称，也保留它用于定位。 */
  toolName: string;
}

/** 执行器创建单项处理通知；runAgent 补上所属模型调用次数。仅包内使用。 */
export type ToolEventData = ToolIdentity &
  (
    | { type: 'tool_start' }
    // 只扩展本事件的含义，字段不变：运行信号可来自主动取消或到期，原因见 run_end.status。
    | { type: 'tool_cancelled' }
    | {
        type: 'tool_end';
        /** true 为已形成失败反馈；false 为成功结果，尚不代表整批已写入循环历史。 */
        isError: boolean;
      }
    | {
        type: 'tool_failed';
        /** 无法形成普通反馈的停止错误；原始异常不进入事件。 */
        code: RunFailureCode;
      }
  );

/** Runtime 各边界提供的摘要；事件派发器另补运行身份与顺序号。仅包内使用。 */
export type RunEventData =
  | { type: 'run_start' }
  // 【新增】这是本轮Context条数，不是HTTP消息数、token或额外调用。
  | {
      type: 'input_prepared';
      /** 接下来拟发起的模型调用序号；观察期间取消时不一定实际发起。 */
      modelCall: number;
      /** 准备前完整运行记录中的消息条数。 */
      historyMessageCount: number;
      /** 准备后本轮Context.messages中的消息条数。 */
      inputMessageCount: number;
    }
  // 只扩展本事件的含义，字段不变：模型等待因运行信号停止，原因见 run_end.status。
  | { type: 'model_cancelled'; modelCall: number }
  // 预览不作为消息写入，流失败后也不能当作最终回答。
  | {
      type: 'model_text_delta';
      /** 当前模型调用序号，复用同一次调用而非发起新调用。 */
      modelCall: number;
      /** 本次新增文字；应用可以展示，不能据此执行工具。 */
      text: string;
    }
  | {
      type: 'model_start';
      /** 即将开始的模型调用序号，从 1 开始；若观察期间取消，实际调用尚未计数。 */
      modelCall: number;
    }
  | {
      type: 'model_end';
      /** 刚取得完整消息的模型调用序号。 */
      modelCall: number;
      /** 完整消息的停止原因，不等于整次任务的停止原因。 */
      stopReason: AssistantMessage['stopReason'];
      /** 完整响应中请求的工具项数，不是已执行数量。 */
      toolCallCount: number;
    }
  | {
      type: 'model_failed';
      /** 失败的模型调用序号；仍计入本次调用预算。 */
      modelCall: number;
      /** Runtime 生成的稳定失败类别，不附原始异常正文。 */
      code: RunFailureCode;
    }
  | (ToolEventData & {
      /** 提出这些请求的模型调用序号；同批多个工具项共用该值。 */
      modelCall: number;
    })
  | {
      type: 'run_end';
      /** 与随后返回的 RunResult.status 一致，answered 也不保证答案正确。 */
      status:
        | 'answered'
        | 'callLimit'
        | 'truncated'
        | 'emptyAnswer'
        | 'failed'
        | 'cancelled'
        // 整次期限到达；不同于用户主动取消或单次 HTTP 失败。
        | 'timedOut'
        // 准备处理下一项工具请求时，累计处理额度不足。
        | 'toolLimit';
      /** 本次实际发起的模型调用总数。 */
      modelCalls: number;
      // 让观察方无需等待最终结果，就能从停止事件取得累计处理数。
      /** finish 从 outcome.toolCalls 复制；含参数被拒绝的尝试，不是请求数组或成功次数。 */
      toolCalls: number;
      /** 仅 status 为 failed 时有值；没有值不表示任务验收通过。 */
      failureCode?: RunFailureCode;
    };

/** Runtime 创建，应用观察；只含原始值；文字片段仅作预览，不附参数、历史或原始异常。 */
export type RunEvent = Readonly<
  RunEventData & {
    /** 同一次 runAgent 的关联身份；不同运行不共用，由 Runtime 生成。 */
    runId: string;
    /** 本次运行从 1 开始递增；用于排序，不代表全局顺序或持久化游标。 */
    sequence: number;
  }
>;

/** 应用提供的观察函数；Runtime 等待其结束，抛错或拒绝只累计观察失败。 */
export type RunEventListener = (event: RunEvent) => void | Promise<void>;
