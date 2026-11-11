// 【新增文件】真实读取加固定模型，仅观察本轮输入与完整记录的关系。
import { resolve } from 'node:path';
import { createWorkspaceTools } from '@ai-harness/coding-tools';
import {
  runAgent,
  type ModelCall,
  type PrepareMessages,
} from '@ai-harness/runtime';

const mode = process.argv[2] ?? 'full';
if (mode !== 'full' && mode !== 'note' && mode !== 'broken') {
  throw new Error('请选择full、note或broken。');
}

const note = '本轮提示：请用简短中文说明取得了什么材料。';
let preparations = 0;
const prepareMessages: PrepareMessages = (history, signal) => {
  signal.throwIfAborted();
  preparations += 1;
  if (mode === 'broken' && preparations === 2) {
    throw new Error('固定故障：第二次输入准备失败。');
  }

  return [...history, { role: 'user', content: note }];
};

let calls = 0;
const callModel: ModelCall = async (context) => {
  calls += 1;
  console.log('固定模型实际收到', {
    call: calls,
    messages: context.messages.length,
    hasInputNote: context.messages.some((message) => message.content === note),
  });

  if (calls === 1) {
    return {
      role: 'assistant',
      content: '',
      stopReason: 'toolUse',
      toolCalls: [{
        id: 'read_current',
        name: 'read_file',
        arguments: JSON.stringify({ path: 'src/routing/normalize.ts' }),
      }],
    };
  }

  const feedback = context.messages.find(
    (message) => message.role === 'toolResult' && message.toolCallId === 'read_current',
  );
  if (!feedback || !feedback.content.includes('normalizePath')) {
    throw new Error('固定观察未收到真实读取反馈。');
  }

  return {
    role: 'assistant',
    content: '固定观察：已收到当前实现的真实读取反馈；未执行修复。',
    stopReason: 'stop',
    toolCalls: [],
  };
};

const tools = await createWorkspaceTools({
  root: resolve('fixtures/route-repair'),
  extensions: ['.ts', '.md'],
});
const result = await runAgent({
  messages: [{ role: 'user', content: '读取当前normalizePath实现，说明取得了什么。' }],
  tools,
  callModel,
  prepareMessages: mode === 'full' ? undefined : prepareMessages,
  maxModelCalls: 8,
  maxToolCalls: 12,
  timeoutMs: 60_000,
  onEvent(event) {
    if (event.type === 'input_prepared') {
      console.log('输入条数', {
        call: event.modelCall,
        history: event.historyMessageCount,
        input: event.inputMessageCount,
      });
    }
  },
});

console.log('完整运行记录', {
  status: result.status,
  phase: result.status === 'failed' ? result.phase : undefined,
  code: result.status === 'failed' ? result.failure.code : undefined,
  modelCalls: result.modelCalls,
  toolCalls: result.toolCalls,
  messages: result.messages.length,
  hasInputNote: result.messages.some((message) => message.content === note),
  roles: result.messages.map((message) => message.role),
});
process.exitCode = result.status === 'answered' ? 0 : 1;
