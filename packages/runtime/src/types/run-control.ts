// 【新增文件】Runtime 内部的一次运行控制契约，不从包入口导出。
/** 首次记录的运行停止原因；模型/工具只读取信号，不解释来源。 */
export type ControlStopStatus = 'cancelled' | 'timedOut';

/** runAgent 创建并持有；负责通知与清理，不持有消息和工具计数。 */
export interface RunControl {
  /** 提供给模型/工具的本次运行信号，不是调用方原 signal。 */
  readonly signal: AbortSignal;
  /** 刷新经过时长并返回已固定的原因；未停止时返回 undefined。 */
  stopStatus: () => ControlStopStatus | undefined;
  /** 移除定时器与外部监听；可重复调用，之后不再产生新的停止原因。 */
  dispose: () => void;
}