// 【新增文件】固定动作仅比较计划接线与开销，不代表模型自主规划。
import type { AssistantMessage, Context, ToolCall } from '@ai-harness/model';
import type { ModelCall, PlanStep, PlanUpdate } from '@ai-harness/runtime';

const call = (id: string, name: string, input: unknown): ToolCall => ({ id, name, arguments: JSON.stringify(input) });
const request = (toolCalls: ToolCall[]): AssistantMessage => ({ role: 'assistant', content: '', stopReason: 'toolUse', toolCalls });
const answer: AssistantMessage = { role: 'assistant', stopReason: 'stop', toolCalls: [], content: '固定总结：保留一次折扣，真实验收记录已返回；交付由应用核对。' };
const path = 'src/checkout/invoice.ts';
const steps = (repair: PlanStep['status'], verify: PlanStep['status'], text: string): PlanStep[] => [
  { step: text, status: repair }, { step: '运行实际验收并核对交付依据', status: verify },
];
const plan = (id: string, expectedRevision: number, explanation: string, items: PlanStep[]) =>
  call(id, 'update_plan', { expectedRevision, explanation, steps: items } satisfies PlanUpdate);

/** 找的是实际工具结果，不用预写文字冒充验收已运行。 */
function requireCheck(context: Context, id: string, status: string): void {
  const result = context.messages.find((message) => message.role === 'toolResult' && message.toolCallId === id);
  if (result?.role !== 'toolResult' || result.isError || JSON.parse(result.content).status !== status) {
    throw new Error('未收到预期的实际验收反馈。');
  }
}

/** 每次创建独立索引；两种模式的读取、改法、验收和答案完全相同。 */
export function createPlanSample(planning: boolean, falseComplete = false): ModelCall {
  let index = 0;
  return async (context, _preview, signal) => {
    signal?.throwIfAborted();
    if (falseComplete) {
      return index++ === 0 ? request([plan('claimed_done', 0, '固定反例：只把清单全部标完成，没有实际修复或验收。',
        steps('completed', 'completed', '修复计算'))]) : answer;
    }
    // 此观察已知目标路径，只读invoice；不用于验证从入口自主调查。
    if (index++ === 0) return request([call('read_code', 'read_file', { path })]);
    if (index === 2) return request([
      ...(planning ? [plan('plan_initial', 0, '固定初始假设：先去掉折扣，等待实际验收。', steps('in_progress', 'pending', '删除折扣乘数'))] : []),
      call('edit_wrong', 'replace_text', { path, oldText: 'return subtotal * (1 - rate) * (1 - rate);', newText: 'return subtotal;' }),
      call('check_failed', 'run_check', {}),
    ]);
    if (index === 3) {
      requireCheck(context, 'check_failed', 'failed');
      return request([
        ...(planning ? [plan('plan_revised', 1, '实际验收1000、预期900；撤回初始改法，保留一次折扣。', steps('in_progress', 'pending', '修正为保留一次折扣'))] : []),
        call('edit_fixed', 'replace_text', { path, oldText: 'return subtotal;', newText: 'return subtotal * (1 - rate);' }),
        call('check_passed', 'run_check', {}),
      ]);
    }
    requireCheck(context, 'check_passed', 'passed');
    if (planning && index === 4) return request([plan('plan_completed', 2, '实际验收通过，当前修复步骤声明完成；仍由应用核对内容版本。',
      steps('completed', 'completed', '修正为保留一次折扣'))]);
    return answer;
  };
}