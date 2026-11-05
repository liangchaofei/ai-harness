// 【新增文件】服务分片被转换后的项目事件，不是服务原始 SSE。
import type { AssistantMessage } from './messages';

/** 模型包创建，应用依次消费；只有 done 中的完整消息可以交给 Runtime 保存。 */
export type ModelStreamEvent =
  | {
      type: 'text_delta';
      /** 本次新增文字，不是截至目前的全部内容；仅作预览。 */
      text: string;
    }
  | {
      type: 'done';
      /** 已收到服务终止标记并完成检查的消息；length 仍不得执行工具。 */
      message: AssistantMessage;
    };
