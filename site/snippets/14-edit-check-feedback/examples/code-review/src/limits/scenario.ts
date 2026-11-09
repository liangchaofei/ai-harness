// 预算观察用固定决策；复用真实读取工具，不请求模型服务。
import { setTimeout as delay } from 'node:timers/promises';
import type { ExecutableTool, ModelCall } from '@ai-harness/runtime';

/** 入口选择观察模式；本函数只创建依赖，不另外实现执行循环。 */
export function createLimitScenario(readTool: ExecutableTool, mode: string) {
  let calls = 0;
  let reads = 0;
  const timed = mode === 'time' || mode === 'late' || mode === 'cancel';
  const tools: ExecutableTool[] = [{
    ...readTool,
    async execute(value, signal) {
      reads += 1;
      return readTool.execute(value, signal);
    },
  }, {
    name: 'wait_sample', description: '只供本地期限观察的固定等待。',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    async execute(_value, signal) {
      try {
        await delay(40, undefined, { signal });
        return '固定等待已完成';
      } finally {
        console.log('固定工具：等待清理完成。');
      }
    },
  }];
  const callModel: ModelCall = async (_context, _preview, signal) => {
    calls += 1;
    if (timed) {
      // 第二次等待仍远小于单次 HTTP 的 30 秒；late 故意不传信号。
      console.log('固定模型：进入等待', calls);
      try {
        await delay(calls === 1 ? 30 : 400, undefined, { signal: mode === 'late' ? undefined : signal });
        console.log('固定模型：等待返回', calls);
      } finally {
        console.log('固定模型：本次等待清理完成', calls);
      }
    }
    if (calls > 1) return { role: 'assistant', content: '固定观察流程已结束。', stopReason: 'stop', toolCalls: [] };
    const read = (id: string) => ({ id, name: 'read_file', arguments: '{"path":"src/cart.ts"}' });
    return {
      role: 'assistant', content: '', stopReason: 'toolUse',
      toolCalls: timed ? [read('read_1'), { id: 'wait_2', name: 'wait_sample', arguments: '{}' }]
        : [read('read_1'), read('read_2'), read('read_3')],
    };
  };
  return { tools, callModel, readCount: () => reads };
}
