// 【新增文件】固定决策观察门禁；工具读取仍是真实 I/O，无模型网络请求。
import { runAgent } from '@ai-harness/runtime';
import { reviewTools } from './tools';
import { printRun } from '../../shared/print-run';

let turn = 0;
const result = await runAgent({
  messages: [{ role: 'user', content: '读取 src/cart.ts，检查参数门禁。' }],
  tools: reviewTools,
  maxModelCalls: 4,
  callModel: async () => {
    turn += 1;
    if (turn <= 2) return {
      role: 'assistant', content: '', stopReason: 'toolUse',
      toolCalls: [{ id: `read_${turn}`, name: 'read_file',
        arguments: JSON.stringify({ path: turn === 1 ? 123 : 'src/cart.ts' }) }],
    };
    return { role: 'assistant', content: '【固定响应】已走完坏参数反馈、正确参数读取；不代表模型自主修正。',
      stopReason: 'stop', toolCalls: [] };
  },
});
printRun(result);
if (result.status !== 'answered') process.exitCode = 1;
