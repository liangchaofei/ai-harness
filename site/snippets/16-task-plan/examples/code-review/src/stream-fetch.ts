// 固定 SSE 材料替代远程响应；保留实际字节流读取，不访问网络。
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import type { ModelProvider } from '@ai-harness/model';

/** 应用检查入口注入；两份预写响应不代表模型自主选择动作。 */
export function createStreamFetch(provider: ModelProvider, interrupt = false): typeof globalThis.fetch {
  let calls = 0;
  return async (_url, init) => {
    calls += 1;
    if (calls > 2 || typeof init?.body !== 'string' || JSON.parse(init.body).stream !== true) {
      throw new Error('固定观察入口只接受两次流式请求。');
    }
    const phase = calls === 1 ? 'tools' : 'answer';
    const url = new URL(`../../../fixtures/model-stream/${provider}-${phase}.sse`, import.meta.url);
    let text = await readFile(url, 'utf8');
    // 模拟响应体提前结束：已给出草稿，但故意没有服务的最终终止标记。
    if (interrupt && calls === 1) {
      const marker = provider === 'deepseek' ? 'data: [DONE]' : 'event: message_stop';
      text = text.slice(0, text.lastIndexOf(marker));
    }
    const bytes = new TextEncoder().encode(text);
    let offset = 0;
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (offset === bytes.length) { controller.close(); return; }
        await delay(20);
        // 32 字节不等于一帧，也可能把一个中文字符拆到两次 pull。
        const next = Math.min(offset + 32, bytes.length);
        controller.enqueue(bytes.slice(offset, next));
        offset = next;
      },
    });
    return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
  };
}
