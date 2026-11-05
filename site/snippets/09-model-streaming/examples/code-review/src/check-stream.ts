// 【新增文件】两种原生协议的固定流观察；工具仍执行真实本地读取，不读取 .env。
import type { ModelProvider } from '@ai-harness/model';
import { runAgent } from '@ai-harness/runtime';
import { createStreamFetch } from './stream-fetch';
import { createStreamingModelCall } from '../../shared/stream-model';
import { reviewTools } from './tools';
import { printEvent } from '../../shared/print-event';
import { printRun } from '../../shared/print-run';

const selected = process.argv[2] ?? 'deepseek';
if (selected !== 'deepseek' && selected !== 'anthropic') throw new Error('请选择 deepseek 或 anthropic。');
const provider: ModelProvider = selected;
const fetch = createStreamFetch(provider, process.argv.includes('--interrupt'));
const callModel = createStreamingModelCall({
  provider, apiKey: 'local-placeholder', model: 'local-sample', fetch,
});

const result = await runAgent({
  messages: [{ role: 'user', content: '读取 src/cart.ts，观察增量与完整消息。' }],
  tools: reviewTools,
  callModel,
  maxModelCalls: 3,
  onEvent: printEvent,
});
printRun(result);
if (result.status !== 'answered') process.exitCode = 1;
