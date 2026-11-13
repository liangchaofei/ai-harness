// 【新增文件】用固定模型在改完后交接，再用另一个进程恢复。
import { runCli } from '../../apps/coding-cli/src/main';

const [mode, path, taskFile = 'fixtures/code-tasks/route.json'] = process.argv.slice(2);
if (!path || (mode !== 'save' && mode !== 'resume')) {
  throw new Error('用法：main.ts save|resume <检查点> [任务配置]');
}

let turn = 0;
process.exitCode = await runCli(
  ['--task', taskFile, mode === 'save' ? '--checkpoint' : '--resume-check', path],
  () => {
    if (mode === 'resume') {
      throw new Error('恢复验收无需创建模型。');
    }
    return async () => {
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
