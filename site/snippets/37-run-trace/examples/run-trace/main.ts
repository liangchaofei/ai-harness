// 【新增文件】固定模型制造两种工具预算结果，保留实际工作区工具。
import { runCli } from '../../apps/coding-cli/src/main';

const [mode, traceFile] = process.argv.slice(2);
if ((mode !== 'limit' && mode !== 'room') || !traceFile) {
  throw new Error('用法：main.ts limit|room <新轨迹文件>');
}

// Runtime 的额度为 12 项。下一批还需要 2 项。
const reads = mode === 'limit' ? 11 : 10;
let turn = 0;

process.exitCode = await runCli(
  ['--task', 'fixtures/code-tasks/invoice.json', '--trace-file', traceFile],
  () => async (_context, onTextDelta) => {
    turn += 1;
    if (turn === 1) {
      await onTextDelta?.('这一段预览只在实时显示中使用。');
      return {
        role: 'assistant',
        content: '',
        stopReason: 'toolUse',
        toolCalls: Array.from({ length: reads }, (_, index) =>
          request(`inspect_${index + 1}`, 'read_file', { path: 'src/main.ts' }),
        ),
      };
    }

    if (turn === 2) {
      return {
        role: 'assistant',
        content: '',
        stopReason: 'toolUse',
        toolCalls: [
          request('invoice_edit', 'replace_text', {
            path: 'src/checkout/invoice.ts',
            oldText: 'return subtotal * (1 - rate) * (1 - rate);',
            newText: 'return subtotal * (1 - rate);',
          }),
          request('invoice_check', 'run_check', {}),
        ],
      };
    }

    return {
      role: 'assistant',
      content: '已提交修改和验收请求，请查看实际结果。',
      stopReason: 'stop',
      toolCalls: [],
    };
  },
);

/** 构造固定模型的单项请求，保留可用于核对轨迹的稳定 ID。 */
function request(id: string, name: string, args: Record<string, unknown>) {
  return { id, name, arguments: JSON.stringify(args) };
}
