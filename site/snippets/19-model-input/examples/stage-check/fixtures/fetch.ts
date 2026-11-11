// 将预写消息编码为两种原生 SSE 样本；不访问网络。
import { setTimeout as delay } from 'node:timers/promises';
import type { AssistantMessage, ModelProvider } from '@ai-harness/model';
import { createStagePlan } from './plans';

/** 只服务固定装置，不能替代 model 中真实的服务适配器。 */
function encodeSample(message: AssistantMessage, provider: ModelProvider) {
  const frames: string[] = [];
  const push = (value: unknown, event = '') =>
    frames.push(
      `${event ? `event: ${event}\n` : ''}data: ${JSON.stringify(value)}\n\n`,
    );
  if (provider === 'deepseek') {
    push({
      choices: [
        {
          index: 0,
          delta: {
            role: 'assistant',
            content: message.content,
          },
          finish_reason: null,
        },
      ],
    });
    message.toolCalls.forEach((call, index) => {
      const middle = Math.floor(call.arguments.length / 2);
      push({
        choices: [
          {
            index: 0,
            delta: {
              tool_calls: [
                {
                  index,
                  id: call.id,
                  type: 'function',
                  function: {
                    name: call.name,
                    arguments: call.arguments.slice(0, middle),
                  },
                },
              ],
            },
            finish_reason: null,
          },
        ],
      });
      push({
        choices: [
          {
            index: 0,
            delta: {
              tool_calls: [
                {
                  index,
                  function: { arguments: call.arguments.slice(middle) },
                },
              ],
            },
            finish_reason: null,
          },
        ],
      });
    });
    push({
      choices: [
        {
          index: 0,
          delta: {},
          finish_reason: message.stopReason === 'toolUse' ? 'tool_calls' : 'stop',
        },
      ],
    });
    return {
      head: frames.join(''),
      tail: 'data: [DONE]\n\n',
    };
  }
  const event = (type: string, fields: Record<string, unknown> = {}) =>
    push(
      {
        type,
        ...fields,
      },
      type,
    );
  event('message_start', {
    message: {
      role: 'assistant',
      content: [],
    },
  });
  event('content_block_start', {
    index: 0,
    content_block: {
      type: 'text',
      text: '',
    },
  });
  event('content_block_delta', {
    index: 0,
    delta: {
      type: 'text_delta',
      text: message.content,
    },
  });
  event('content_block_stop', { index: 0 });
  message.toolCalls.forEach((call, position) => {
    const index = position + 1;
    event('content_block_start', {
      index,
      content_block: {
        type: 'tool_use',
        id: call.id,
        name: call.name,
        input: {},
      },
    });
    const middle = Math.floor(call.arguments.length / 2);
    for (const partial_json of [
      call.arguments.slice(0, middle),
      call.arguments.slice(middle),
    ]) {
      event('content_block_delta', {
        index,
        delta: {
          type: 'input_json_delta',
          partial_json,
        },
      });
    }
    event('content_block_stop', { index });
  });
  event('message_delta', {
    delta: { stop_reason: message.stopReason === 'toolUse' ? 'tool_use' : 'end_turn' },
  });
  return {
    head: frames.join(''),
    tail: 'event: message_stop\ndata: {"type":"message_stop"}\n\n',
  };
}

/** 入口注入此 fetch；finalResponse 只告诉装置何时安排取消，不参与 Runtime 决策。 */
export function createStageFetch(
  task: 'review' | 'release',
  provider: ModelProvider,
  mode: string,
) {
  const plan = createStagePlan(task, mode === 'recover');
  let calls = 0;
  let finalResponse = false;
  const fetch: typeof globalThis.fetch = async (_url, init) => {
    init?.signal?.throwIfAborted();
    if (typeof init?.body !== 'string') {
      throw new Error('固定装置缺少请求正文。');
    }
    const body = JSON.parse(init.body);
    if (body.stream !== true) {
      throw new Error('固定装置只观察流式调用。');
    }
    // 验证坏参数反馈确实经过 model 编码进入下一次请求；后续响应仍是预写的。
    if (
      mode === 'recover' &&
      calls === 1 &&
      !JSON.stringify(body.messages).includes('invalid_arguments')
    ) {
      throw new Error('没有收到本地参数拒绝反馈。');
    }
    const message = plan[calls++];
    if (!message) {
      throw new Error('固定响应计划已耗尽。');
    }
    finalResponse = calls === plan.length;
    const { head, tail } = encodeSample(message, provider);
    const bytes = new TextEncoder().encode(head);
    const waiting = finalResponse && (mode === 'cancel' || mode === 'deadline');
    const cutoff = finalResponse && mode === 'cutoff';
    const source = new AbortController();
    const signal = init.signal
      ? AbortSignal.any([init.signal, source.signal])
      : source.signal;
    let offset = 0;
    let tailSent = false;
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          if (offset < bytes.length) {
            const next = Math.min(offset + 32, bytes.length);
            controller.enqueue(bytes.slice(offset, next));
            offset = next;
            return;
          }
          if (cutoff) {
            controller.close();
            return;
          }
          if (!tailSent) {
            if (waiting) {
              try {
                await delay(400, undefined, { signal });
              } finally {
                console.log('固定 HTTP：最终尾帧等待退出。');
              }
            }
            controller.enqueue(new TextEncoder().encode(tail));
            tailSent = true;
            return;
          }
          controller.close();
        } catch (error) {
          // reader 提前退出时取消本地等待，不再向已经取消的流报错。
          if (!source.signal.aborted) {
            controller.error(error);
          }
        }
      },
      cancel() {
        source.abort();
      },
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
  };
  return {
    fetch,
    isFinalResponse: () => finalResponse,
  };
}
