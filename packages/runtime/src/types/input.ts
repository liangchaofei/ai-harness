// 【新增文件】本轮消息准备与Runtime内部组装配置。
import type { Context, Message, ToolDefinition } from '@ai-harness/model';

/**
 * 应用提供，Runtime在每次模型调用前等待；输入是独立消息副本。
 * 返回值仅用于本轮输入，不替换完整记录。省略时保留全部消息。
 * 可信应用须保留任务依据与工具请求/反馈关系；此类型不做语义验证。
 */
export type PrepareMessages = (
  history: readonly Message[],
  signal: AbortSignal,
) => readonly Message[] | Promise<readonly Message[]>;

/** Runtime创建并交给包内输入组装函数；不从公开入口导出。 */
export interface InputPreparationOptions {
  /** 沿用本次运行配置的系统要求，准备回调不能通过返回值替换它。 */
  systemPrompt?: Context['systemPrompt'];
  /** 从实际工具注册表生成的说明，不包含execute。 */
  tools: readonly ToolDefinition[];
  /** 应用可选的本轮消息转换；失败将停止本次运行。 */
  prepareMessages?: PrepareMessages;
  /** 与模型和工具共用整次运行信号；准备函数应协作取消。 */
  signal: AbortSignal;
}