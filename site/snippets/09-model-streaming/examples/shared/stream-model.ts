// 【新增文件】应用把模型包的流连接到 Runtime 单次调用，两个任务和本地观察共用。
import { stream, type CompleteOptions } from '@ai-harness/model';
import type { ModelCall } from '@ai-harness/runtime';

/** 绑定可信服务配置；预览交给通知函数，唯一完整消息作为 ModelCall 返回值。 */
export function createStreamingModelCall(options: CompleteOptions): ModelCall {
  return async (context, onTextDelta) => {
    for await (const event of stream(context, options)) {
      if (event.type === 'text_delta') await onTextDelta?.(event.text);
      else return event.message;
    }
    throw new Error('模型流未返回完整消息。');
  };
}
