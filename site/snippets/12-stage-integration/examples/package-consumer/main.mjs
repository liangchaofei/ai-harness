// 【新增文件】仅通过三个包的公开入口，在仓库外读取使用者材料。
import { fileURLToPath } from 'node:url';
import { stream } from '@ai-harness/model';
import { runAgent } from '@ai-harness/runtime';
import { createReadFileTool } from '@ai-harness/coding-tools';

const controller = new AbortController();
const cancel = process.argv.includes('--cancel');
let calls = 0;

// 固定两次 HTTP 响应，读文件和运行控制仍由真实包执行。
const localFetch = async (_url, init) => {
  const request = JSON.parse(init.body);
  calls += 1;
  if (calls === 2 && !JSON.stringify(request.messages).includes('externalMaterial')) {
    throw new Error('第二次请求未带回实际文件内容。');
  }
  const delta = calls === 1 ? {
    tool_calls: [{ index: 0, id: 'external_1', type: 'function',
      function: { name: 'read_file', arguments: '{"path":"source.ts"}' } }],
  } : { content: '固定答案：已经读取使用者配置的 source.ts。' };
  const frame = (delta, finish_reason) => `data: ${JSON.stringify({
    choices: [{ index: 0, delta, finish_reason }],
  })}\n\n`;
  return new Response(frame(delta, null) + frame({}, calls === 1 ? 'tool_calls' : 'stop')
    + 'data: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
};

const result = await runAgent({
  messages: [{ role: 'user', content: '读取 source.ts 并说明读取结果。' }],
  tools: [createReadFileTool({ files: {
    'source.ts': fileURLToPath(new URL('./source.ts', import.meta.url)),
  } })],
  async callModel(context, onTextDelta, signal) {
    for await (const event of stream(context, {
      provider: 'deepseek', apiKey: 'local-placeholder', model: 'local-sample',
      fetch: localFetch, signal,
    })) {
      if (event.type === 'text_delta') await onTextDelta?.(event.text);
      else return event.message;
    }
    throw new Error('缺少完整消息。');
  },
  maxModelCalls: 3, maxToolCalls: 2, timeoutMs: 5_000,
  signal: controller.signal,
  onEvent(event) {
    if (cancel && event.type === 'tool_end') controller.abort();
  },
});
const hasOwnSource = result.messages.some((message) => message.role === 'toolResult'
  && !message.isError && message.content.includes('externalMaterial'));
console.log({ source: '固定 HTTP，真实文件读取', status: result.status,
  modelCalls: result.modelCalls, toolCalls: result.toolCalls, hasOwnSource });
if (result.status !== (cancel ? 'cancelled' : 'answered') || !hasOwnSource
  || result.modelCalls !== (cancel ? 1 : 2) || result.toolCalls !== 1) process.exitCode = 1;
