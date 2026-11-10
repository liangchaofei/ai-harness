// 预写两次修改决策；实际写文件、启动验收并核对失败反馈。
import type { AssistantMessage, ToolCall } from '@ai-harness/model';
import { runRepair } from './repair-run';

// --stale复现通过后再修改，--recheck在新内容上重新验收。
const stale = process.argv.includes('--stale');
const recheck = process.argv.includes('--recheck');
const call = (id: string, name: string, value: unknown): ToolCall => ({ id, name, arguments: JSON.stringify(value) });
const request = (toolCalls: ToolCall[]): AssistantMessage => ({ role: 'assistant', content: '', stopReason: 'toolUse', toolCalls });
const path = 'src/checkout/invoice.ts';
const plan: AssistantMessage[] = [
  request([
    call('read_entry', 'read_file', { path: 'src/main.ts' }),
    call('read_code', 'read_file', { path }),
    call('read_rule', 'read_file', { path: 'src/pricing/policy.ts' }),
  ]),
  request([
    call('edit_wrong', 'replace_text', { path, oldText: 'return subtotal * (1 - rate) * (1 - rate);', newText: 'return subtotal;' }),
    call('check_failed', 'run_check', {}),
  ]),
  request([
    call('edit_fixed', 'replace_text', { path, oldText: 'return subtotal;', newText: 'return subtotal * (1 - rate);' }),
    call('check_passed', 'run_check', {}),
  ]),
  { role: 'assistant', stopReason: 'stop', toolCalls: [], content: '固定总结：第一次删掉全部折扣未通过，随后保留一次折扣。实际验收通过，副本留待审阅，未修改原材料。' },
];
// 仅追加注释也会改变内容标识，不能借用上次通过。
if (recheck) plan[0] = request(plan[0]!.toolCalls.filter((call) => call.id !== 'read_entry'));
if (stale || recheck) {
  plan.splice(3, 0, request([
    call('edit_after_check', 'replace_text', { path, oldText: 'return subtotal * (1 - rate);',
      newText: 'return subtotal * (1 - rate); // reviewed' }),
    ...(recheck ? [call('check_current', 'run_check', {})] : []),
  ]));
}
let index = 0;
await runRepair(() => async (context, _onTextDelta, signal) => {
  signal?.throwIfAborted();
  const id = index === 2 ? 'check_failed' : index === 3 ? 'check_passed' : undefined;
  if (id) {
    const feedback = context.messages.find((message) => message.role === 'toolResult' && message.toolCallId === id);
    if (feedback?.role !== 'toolResult' || feedback.isError
      || JSON.parse(feedback.content).status !== (index === 2 ? 'failed' : 'passed')) {
      throw new Error('未收到预期的实际验收反馈。');
    }
  }
  const message = plan[index++];
  if (!message) throw new Error('固定计划耗尽。');
  return message;
});
