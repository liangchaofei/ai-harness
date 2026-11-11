// 固定模型决定用于观察事件时机；实际文件读取复用原工具，无网络调用。
import { setTimeout as delay } from 'node:timers/promises';
import type { AssistantMessage } from '@ai-harness/model';
import { runAgent, type ModelCall } from '@ai-harness/runtime';
import { reviewTools } from './tools';
import { printEvent } from '../../shared/print-event';
import { printRun } from '../../shared/print-run';
import { logLine } from '../../shared/terminal';

let modelCalls = 0;
/** 固定等待与固定响应，便于在模型完成前观察开始事件；不模拟模型自主决策。 */
const callModel: ModelCall = async (context): Promise<AssistantMessage> => {
  modelCalls += 1;
  logLine('固定模型等待', `本次输入消息数：${context.messages.length}`);
  await delay(500);
  if (modelCalls === 1) {
    return {
      role: 'assistant',
      content: '',
      stopReason: 'toolUse',
      toolCalls: [
        {
          id: 'read_1',
          name: 'read_file',
          arguments: JSON.stringify({ path: 'src/cart.ts' }),
        },
      ],
    };
  }
  return {
    role: 'assistant',
    stopReason: 'stop',
    toolCalls: [],
    content: '【固定响应】只观察事件及真实读取，不证明模型自主审查质量。',
  };
};

const result = await runAgent({
  messages: [
    {
      role: 'user',
      content: '读取 src/cart.ts，观察运行进度。',
    },
  ],
  tools: reviewTools,
  callModel,
  maxModelCalls: 3,
  onEvent: printEvent,
});
printRun(result);
if (result.status !== 'answered') {
  process.exitCode = 1;
}
