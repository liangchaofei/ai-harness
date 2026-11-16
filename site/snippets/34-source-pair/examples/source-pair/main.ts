// 【新增文件】以固定响应观察扩展成功、读取越界及真实验收。
import { runCli } from '../../apps/coding-cli/src/main';

const mode = process.argv[2] ?? 'repair';
if (mode !== 'repair' && mode !== 'out-of-scope') {
  throw new Error('用法：main.ts repair|out-of-scope');
}

const task = 'fixtures/code-tasks/invoice-source-pair.json';
const args = ['--task', task];
if (mode === 'out-of-scope') {
  args.push('--read-only');
}

process.exitCode = await runCli(args, () => {
  let turn = 0;

  return async ({ tools = [], messages }) => {
    if (!tools.some((tool) => tool.name === 'read_source_pair')) {
      throw new Error('当前任务缺少双文件调查工具。');
    }
    turn += 1;

    if (turn === 1) {
      return request('inspect_invoice', 'read_source_pair', {
        entry: 'src/main.ts',
        candidate: mode === 'repair' ? 'src/checkout/invoice.ts' : '../outside.ts',
      });
    }

    if (turn === 2) {
      const feedback = messages.at(-1);
      if (feedback?.role !== 'toolResult' || feedback.toolCallId !== 'inspect_invoice' ||
          feedback.isError !== (mode === 'out-of-scope')) {
        throw new Error('双文件调查结果与场景不符。');
      }
      if (mode === 'out-of-scope') {
        return request('retry_invoice', 'read_source_pair', {
          entry: 'src/main.ts',
          candidate: 'src/checkout/invoice.ts',
        });
      }
      if (!feedback.content.includes("from './checkout/invoice'") ||
          !feedback.content.includes('(1 - rate) * (1 - rate)')) {
        throw new Error('调查结果缺少入口或当前计算。');
      }
      return request('edit_invoice', 'replace_text', {
        path: 'src/checkout/invoice.ts',
        oldText: 'return subtotal * (1 - rate) * (1 - rate);',
        newText: 'return subtotal * (1 - rate);',
      });
    }

    if (turn === 3) {
      if (mode === 'out-of-scope') {
        const feedback = messages.at(-1);
        if (feedback?.role !== 'toolResult' || feedback.toolCallId !== 'retry_invoice' ||
            feedback.isError || !feedback.content.includes("from './checkout/invoice'")) {
          throw new Error('只读模式下的第二次调查未成功。');
        }
        return answer('已改用工作区内路径完成调查，当前为只读模式。');
      }
      return request('check_invoice', 'run_check', {});
    }

    return answer('已修改当前计算，请查看实际验收。');
  };
});

/** 固定响应使用和真实模型相同的工具请求结构。 */
function request(id: string, name: string, args: Record<string, unknown>) {
  return {
    role: 'assistant',
    stopReason: 'toolUse',
    content: '',
    toolCalls: [{ id, name, arguments: JSON.stringify(args) }],
  } as const;
}

/** 固定总结只负责结束循环，实际交付由原报告逻辑判断。 */
function answer(content: string) {
  return {
    role: 'assistant',
    stopReason: 'stop',
    content,
    toolCalls: [],
  } as const;
}
