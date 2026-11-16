// 【新增文件】观察同一个修改请求在只读权限下得到什么反馈。
import assert from 'node:assert/strict';
import { runCli } from '../../apps/coding-cli/src/main';

let turn = 0;
const exitCode = await runCli(
  ['--task', 'fixtures/code-tasks/route.json', '--read-only'],
  () => async (context) => {
    turn += 1;
    if (turn === 1) {
      return {
        role: 'assistant',
        content: '',
        stopReason: 'toolUse',
        toolCalls: [
          { id: 'read', name: 'read_file', arguments: '{"path":"src/main.ts"}' },
          {
            id: 'edit',
            name: 'replace_text',
            arguments: JSON.stringify({
              path: 'src/routing/normalize.ts',
              oldText: "return path.split('?')[0]!.replace(/\\/$/, '');",
              newText: 'return path;',
            }),
          },
          { id: 'check', name: 'run_check', arguments: '{}' },
        ],
      };
    }

    for (const [id, isError] of [['read', false], ['edit', true], ['check', true]] as const) {
      const feedback = context.messages.find(
        (message) => message.role === 'toolResult' && message.toolCallId === id,
      );
      assert.ok(feedback?.role === 'toolResult');
      assert.equal(feedback.isError, isError);
      if (isError) assert.match(feedback.content, /只读模式禁止/);
    }

    return {
      role: 'assistant',
      content: '已读取入口。修改和验收被只读权限拒绝。',
      stopReason: 'stop',
      toolCalls: [],
    };
  },
);

assert.equal(turn, 2);
assert.equal(exitCode, 1);
