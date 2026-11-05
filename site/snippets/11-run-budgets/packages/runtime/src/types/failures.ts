// Runtime 返回给应用的受控失败信息。
import type { ModelFailureKind } from '@ai-harness/model';

/** 程序可据此分支；不承诺某类别一定值得重试。 */
export type RunFailureCode =
  | `model_${ModelFailureKind}` | 'model_unknown'
  | 'tool_configuration' | 'tool_protocol' | 'tool_execution';

/** Runtime 创建，应用展示；不包含原参数、源码或任意异常正文。 */
export interface RunFailure {
  /** 应用据此选择展示或处理分支，不从异常文本提取含义。 */
  code: RunFailureCode;
  /** 由框架生成的受控说明，原始异常另留在 RunResult.error。 */
  message: string;
  /** 仅工具执行异常时关联当项；不是断点恢复句柄。 */
  toolCallId?: string;
  /** 仅 HTTP 错误携带服务状态码。 */
  httpStatus?: number;
}
