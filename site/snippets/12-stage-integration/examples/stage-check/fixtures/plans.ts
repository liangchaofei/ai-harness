// 【新增文件】预写响应计划，只用于重复观察程序路径，不代表自主决策。
import type { AssistantMessage, ToolCall } from '@ai-harness/model';

/** 本地装置取得固定计划；真正任务工厂不依赖本文件。 */
export function createStagePlan(task: 'review' | 'release', recover: boolean): AssistantMessage[] {
  const action = (content: string, toolCalls: ToolCall[]): AssistantMessage => ({
    role: 'assistant', content, stopReason: 'toolUse', toolCalls,
  });
  const call = (id: string, name: string, value: unknown): ToolCall => ({
    id, name, arguments: JSON.stringify(value),
  });
  const plan: AssistantMessage[] = task === 'review' ? [
    action('固定响应：读取入口和折扣规则。', [
      call('read_invoice', 'read_file', { path: 'src/invoice.ts' }),
      call('read_pricing', 'read_file', { path: 'src/pricing.ts' }),
    ]),
    { role: 'assistant', stopReason: 'stop', toolCalls: [],
      content: '固定答案：invoiceTotal重复应用折扣。单价100、数量10，pricing规则给出10%折扣，当前810，正确900。' },
  ] : [
    action('固定响应：查询本次发布。', [call('release_1', 'lookup_release', { id: 'release-57' })]),
    action('固定响应：读取两个变更服务。', [
      call('quote_2', 'lookup_service', { id: 'quote-api' }),
      call('checkout_3', 'lookup_service', { id: 'checkout-api' }),
    ]),
    { role: 'assistant', stopReason: 'stop', toolCalls: [],
      content: '固定答案：release-57涉及quote-api（定价组）与checkout-api（交易组），两者直接依赖pricing-core。这是共享依赖信息，未验证影响传播，未发送通知。' },
  ];
  if (recover) {
    plan.unshift(action('固定响应：故意产生一次坏参数。', [task === 'review'
      ? call('bad_0', 'read_file', { path: 42 })
      : call('bad_0', 'lookup_release', { id: 42 })]));
  }
  return plan;
}
