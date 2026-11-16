// 用固定模型在改完后交接，再用另一个进程恢复。
import { runCli } from '../../apps/coding-cli/src/main';

const [mode, path, taskFile = 'fixtures/code-tasks/route.json'] = process.argv.slice(2);
// 【修改】沿用同一份固定模型，增加跨进程批准的准备入口。
if (!path || (mode !== 'save' && mode !== 'save-gated' && mode !== 'resume')) {
  throw new Error('用法：main.ts save|save-gated|resume <检查点> [任务配置]');
}
const args = ['--task', taskFile, mode === 'resume' ? '--resume-check' : '--checkpoint', path];
if (mode === 'save-gated') {
  args.push('--gate-check');
}

let turn = 0;
process.exitCode = await runCli(
  args,
  () => {
    if (mode === 'resume') {
      throw new Error('恢复验收无需创建模型。');
    }
    return async ({ tools = [] }) => {
      if (mode === 'save-gated' && tools.some((tool) => tool.name === 'run_check')) {
        throw new Error('准备阶段不应提供验收工具。');
      }
      turn += 1;
      if (turn === 1) {
        return {
          role: 'assistant',
          content: '',
          stopReason: 'toolUse',
          toolCalls: [{
            id: 'edit_before_handoff',
            name: 'replace_text',
            arguments: JSON.stringify({
              path: 'src/routing/normalize.ts',
              oldText: "return path.split('?')[0]!.replace(/\\/$/, '');",
              newText: "const clean = path.split(/[?#]/)[0]!;\n  return clean.replace(/\\/+$/, '') || '/';",
            }),
          }],
        };
      }
      return {
        role: 'assistant',
        content: '已修改，等待验收。',
        stopReason: 'stop',
        toolCalls: [],
      };
    };
  },
);
