// 【新增文件】固定模型选择工具，真实 MCP 子进程查询规则。
import { runCli } from '../../apps/coding-cli/src/main';

const mode = process.argv[2] ?? 'repair';
if (mode !== 'repair' && mode !== 'missing-rule') {
  throw new Error('用法：main.ts repair|missing-rule');
}

const args = ['--task', 'fixtures/code-tasks/invoice-mcp.json'];
if (mode === 'missing-rule') {
  args.push('--read-only');
}

process.exitCode = await runCli(args, () => {
  let turn = 0;

  return async ({ tools = [], messages }) => {
    if (!tools.some((tool) => tool.name === 'read_invoice_policy')) {
      throw new Error('未装配发票规则工具。');
    }

    turn += 1;
    if (turn === 1) {
      const rule = mode === 'repair' ? 'bulk-discount' : 'unknown-rule';
      return request('policy_lookup', 'read_invoice_policy', { rule });
    }

    if (turn === 2) {
      const feedback = messages.at(-1);
      if (feedback?.role !== 'toolResult' || feedback.toolCallId !== 'policy_lookup' ||
          feedback.isError !== (mode === 'missing-rule')) {
        throw new Error('没有收到符合预期的 MCP 调用反馈。');
      }
      if (mode === 'missing-rule') {
        return request('policy_retry', 'read_invoice_policy', { rule: 'bulk-discount' });
      }
      if (!feedback.content.includes('只应用一次折扣')) {
        throw new Error('查询结果缺少折扣规则。');
      }
      return request('invoice_entry', 'read_file', { path: 'src/main.ts' });
    }

    if (mode === 'missing-rule') {
      const feedback = messages.at(-1);
      if (feedback?.role !== 'toolResult' || feedback.toolCallId !== 'policy_retry' ||
          feedback.isError || !feedback.content.includes('只应用一次折扣')) {
        throw new Error('重新查询后未取得折扣规则。');
      }
      return answer('已取得折扣规则，本次只读调查结束。');
    }

    if (turn === 3) {
      const feedback = messages.at(-1);
      if (feedback?.role !== 'toolResult' || feedback.isError ||
          !feedback.content.includes("from './checkout/invoice'")) {
        throw new Error('入口没有指向预期的当前实现。');
      }
      return request('invoice_current', 'read_file', { path: 'src/checkout/invoice.ts' });
    }

    if (turn === 4) {
      const oldText = 'return subtotal * (1 - rate) * (1 - rate);';
      const feedback = messages.at(-1);
      if (feedback?.role !== 'toolResult' || feedback.isError || !feedback.content.includes(oldText)) {
        throw new Error('当前实现在预期位置缺少重复折扣。');
      }
      return request('invoice_edit', 'replace_text', {
        path: 'src/checkout/invoice.ts',
        oldText,
        newText: 'return subtotal * (1 - rate);',
      });
    }

    if (turn === 5) {
      return request('invoice_check', 'run_check', {});
    }

    return answer('已修改折扣算法，请查看实际验收结果。');
  };
});

/** 构造 Runtime 接收的统一模型工具请求。 */
function request(id: string, name: string, args: Record<string, unknown>) {
  return {
    role: 'assistant',
    stopReason: 'toolUse',
    content: '',
    toolCalls: [{ id, name, arguments: JSON.stringify(args) }],
  } as const;
}

/** 结束固定模型的运行段，报告层仍按副本和实际结果判断。 */
function answer(content: string) {
  return { role: 'assistant', stopReason: 'stop', content, toolCalls: [] } as const;
}
