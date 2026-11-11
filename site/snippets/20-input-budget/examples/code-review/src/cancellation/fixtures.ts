// 只供取消观察：固定服务片段与等待工具，不代表模型自主行为。
import { setTimeout as delay } from 'node:timers/promises';
import type { ModelProvider } from '@ai-harness/model';
import type { ExecutableTool, ModelCall } from '@ai-harness/runtime';

/** 返回一帧预览后等待；响应体读取中取消时，释放计时器和 abort 监听。 */
export function createWaitingFetch(provider: ModelProvider): typeof globalThis.fetch {
  return async (_url, init) => {
    const signal = init?.signal;
    signal?.throwIfAborted();
    const first =
      provider === 'deepseek'
        ? 'data: {"choices":[{"index":0,"delta":{"content":"正在等待"},"finish_reason":null}]}\n\n'
        : 'event: message_start\ndata: {"type":"message_start","message":{"role":"assistant","content":[]}}\n\n' +
          'event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n\n' +
          'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"正在等待"}}\n\n';
    const last =
      provider === 'deepseek'
        ? 'data: {"choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n'
        : 'event: content_block_stop\ndata: {"type":"content_block_stop","index":0}\n\n' +
          'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\n' +
          'event: message_stop\ndata: {"type":"message_stop"}\n\n';
    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;
    const cleanup = () => {
      clearTimeout(timer);
      if (onAbort) {
        signal?.removeEventListener('abort', onAbort);
      }
    };
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        onAbort = () => {
          cleanup();
          controller.error(signal?.reason);
          console.log('固定 HTTP：响应体等待已取消，计时器和监听已释放。');
        };
        signal?.addEventListener('abort', onAbort, { once: true });
        controller.enqueue(encoder.encode(first));
        timer = setTimeout(() => {
          cleanup();
          controller.enqueue(encoder.encode(last));
          controller.close();
        }, 200);
      },
      cancel() {
        cleanup();
      },
    });
    return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
  };
}

/** 固定一批：真实读取 → 可取消/故意不协作的等待 → 再读；第二次固定文本只用于观察正常对照。 */
export function createToolScenario(
  readTool: ExecutableTool,
  controller: AbortController,
  ignoreSignal: boolean,
  cancel: boolean,
) {
  let reads = 0;
  let calls = 0;
  const trackedRead: ExecutableTool = {
    ...readTool,
    async execute(value, signal) {
      reads += 1;
      return readTool.execute(value, signal);
    },
  };
  const waitTool: ExecutableTool = {
    name: 'wait_for_sample',
    description: '仅供本地取消观察的固定等待，不访问外部系统。',
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    async execute(_value, signal) {
      const timer = cancel ? setTimeout(() => controller.abort(), 20) : undefined;
      console.log(
        `固定工具：开始等待，${ignoreSignal ? '故意忽略' : '接收'}取消信号。`,
      );
      try {
        await delay(100, undefined, { signal: ignoreSignal ? undefined : signal });
        console.log('固定工具：等待完成，准备返回。');
        return '固定等待结果';
      } finally {
        clearTimeout(timer);
        console.log('固定工具：finally 清理完成。');
      }
    },
  };
  const callModel: ModelCall = async () => {
    calls += 1;
    return calls === 1
      ? {
          role: 'assistant',
          content: '',
          stopReason: 'toolUse',
          toolCalls: [
            {
              id: 'read_1',
              name: 'read_file',
              arguments: '{"path":"src/cart.ts"}',
            },
            {
              id: 'wait_2',
              name: 'wait_for_sample',
              arguments: '{}',
            },
            {
              id: 'read_3',
              name: 'read_file',
              arguments: '{"path":"src/cart.ts"}',
            },
          ],
        }
      : {
          role: 'assistant',
          content: '固定流程已结束。',
          stopReason: 'stop',
          toolCalls: [],
        };
  };
  return {
    tools: [trackedRead, waitTool],
    callModel,
    readCount: () => reads,
  };
}
