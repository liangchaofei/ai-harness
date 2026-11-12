import { complete, type ModelProvider } from '@ai-harness/model';
import { runAgent } from '@ai-harness/runtime';
import { reviewTools } from './tools';
import { reportRun } from './report-run';
import { createProtocolFetch } from './protocol-fetch';

const provider = process.argv[2] ?? 'anthropic';
if (provider !== 'deepseek' && provider !== 'anthropic') {
  throw new Error('只接受 deepseek 或 anthropic。');
}
const selected: ModelProvider = provider;
const localFetch = await createProtocolFetch(selected);
console.log('本地协议观察：模型请求与回答均来自固定样本，不访问模型服务。');
const result = await runAgent({
  messages: [
    {
      role: 'user',
      content: '请读取 src/cart.ts，再审查计算问题。',
    },
  ],
  systemPrompt: '只依据读取结果回答。',
  tools: reviewTools,
  callModel: (context) =>
    complete(context, {
      provider: selected,
      apiKey: 'local-placeholder',
      model: selected === 'deepseek' ? 'deepseek-flash' : 'claude-haiku-5-5',
      fetch: localFetch,
    }),
  maxModelCalls: 4,
});
if (!reportRun(result, 'src/cart.ts')) {
  process.exitCode = 1;
}
