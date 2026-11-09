// 【新增文件】无 Key 的固定决策观察；不经过服务协议，工具与 Runtime 实际运行。
import type { AssistantMessage, ToolCall } from '@ai-harness/model';
import { runAgent } from '@ai-harness/runtime';
import { createWorkspaceReviewTask } from './workspace-task';
import { createInterrupt } from '../../shared/interrupt';
import { printEvent } from '../../shared/print-event';
import { logBlock } from '../../shared/terminal';

const mode = process.argv[2] ?? 'normal';
if (mode !== 'normal' && mode !== 'recover') throw new Error('模式为 normal 或 recover。');
const call = (id: string, name: string, value: unknown): ToolCall => ({ id, name, arguments: JSON.stringify(value) });
const request = (toolCalls: ToolCall[]): AssistantMessage => ({ role: 'assistant', content: '', stopReason: 'toolUse', toolCalls });
const plan: AssistantMessage[] = [
  request([call('find_1', 'find_files', { query: 'invoice' })]),
  request([call('search_2', 'search_source', { query: 'discountRate' })]),
  request([
    call('read_entry', 'read_file', { path: 'src/main.ts' }),
    call('read_invoice', 'read_file', { path: 'src/checkout/invoice.ts' }),
    call('read_policy', 'read_file', { path: 'src/pricing/policy.ts' }),
  ]),
  { role: 'assistant', stopReason: 'stop', toolCalls: [], content: '固定答案：src/main.ts:2导出当前计算函数。src/checkout/invoice.ts:7连续应用两次折扣，src/pricing/policy.ts:3规定满10件10%折扣。单价100、数量10，当前810，正确900。历史文件不在此链。' },
];
if (mode === 'recover') plan.unshift(request([call('bad_path', 'read_file', { path: '../outside.ts' })]));
const interrupt = createInterrupt();
let index = 0;
try {
  const task = await createWorkspaceReviewTask(undefined, interrupt.signal);
  const result = await runAgent({
    ...task.input,
    async callModel(context, _onTextDelta, signal) {
      signal?.throwIfAborted();
      if (mode === 'recover' && index === 1
        && !context.messages.some((m) => m.role === 'toolResult' && m.toolCallId === 'bad_path' && m.isError)) {
        throw new Error('未收到索引外路径拒绝反馈。');
      }
      const message = plan[index++];
      if (!message) throw new Error('固定计划耗尽。');
      return message;
    },
    maxModelCalls: 6, maxToolCalls: 8, timeoutMs: 60_000,
    signal: interrupt.signal, onEvent: printEvent,
  });
  const accepted = task.report(result);
  logBlock('工作区观察', { source: '固定 ModelCall，真实工作区 I/O', mode,
    status: result.status, modelCalls: result.modelCalls, toolCalls: result.toolCalls, taskAccepted: accepted });
  if (!accepted) process.exitCode = 1;
} catch {
  console.error('工作区准备、运行或展示失败，请在入口断点检查；未输出原始异常正文。');
  process.exitCode = 1;
} finally { interrupt.dispose(); }
