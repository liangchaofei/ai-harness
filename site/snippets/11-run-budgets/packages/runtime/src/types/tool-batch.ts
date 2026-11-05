// 【新增文件】仅供 Runtime 内部的批次观察、停止与预算接线。
import type { ToolEventData } from './events';

/** runAgent 提供；执行器不拥有运行总计数，也不自己创建任务定时器。 */
export interface ToolBatchOptions {
  /** 来自本次运行控制；公开直接执行时也可以只有外部信号。 */
  signal?: AbortSignal;
  /** 处理单项时通知 Runtime，由其补运行身份；不负责写历史。 */
  notify?: (event: ToolEventData) => Promise<void>;
  /** 刷新期限；随后执行器读 signal。仅由可信 Runtime 提供。 */
  checkStop?: () => void;
  /** 由 Runtime 检查并累计一次处理尝试；false 表示没有额度，不开始该项。 */
  tryStartToolCall?: () => boolean;
}
