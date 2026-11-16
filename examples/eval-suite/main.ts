// 【新增文件】为真实任务集入口注入可重复的模型响应。
import { runCli } from '../../apps/coding-cli/src/main';

const [mode, output] = process.argv.slice(2);
if ((mode !== 'baseline' && mode !== 'skip-route-check') || !output) {
  throw new Error('用法：main.ts baseline|skip-route-check <新目录>');
}

process.exitCode = await runCli(
  ['--eval-suite', 'fixtures/eval/code-tasks.json', '--eval-output', output],
  () => {
    let turn = 0;
    return async ({ messages }) => {
      turn += 1;
      const route = messages.some((message) =>
        message.role === 'user' && message.content.includes('normalizePath'),
      );

      if (turn === 1) {
        const edit = route
          ? {
              path: 'src/routing/normalize.ts',
              oldText: "return path.split('?')[0]!.replace(/\\/$/, '');",
              newText: "const clean = path.split(/[?#]/)[0]!;\n  return clean.replace(/\\/+$/, '') || '/';",
            }
          : {
              path: 'src/checkout/invoice.ts',
              oldText: 'return subtotal * (1 - rate) * (1 - rate);',
              newText: 'return subtotal * (1 - rate);',
            };
        return request('eval_edit', 'replace_text', edit);
      }

      if (turn === 2 && !(route && mode === 'skip-route-check')) {
        return request('eval_check', 'run_check', {});
      }

      return {
        role: 'assistant',
        content: '已完成本轮操作，请检查实际交付结果。',
        stopReason: 'stop',
        toolCalls: [],
      };
    };
  },
);

/** 固定模型沿用正式工具请求的形状。 */
function request(id: string, name: string, args: Record<string, unknown>) {
  return {
    role: 'assistant',
    content: '',
    stopReason: 'toolUse',
    toolCalls: [{ id, name, arguments: JSON.stringify(args) }],
  } as const;
}
