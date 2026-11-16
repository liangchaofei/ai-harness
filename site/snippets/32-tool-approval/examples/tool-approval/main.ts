// 用固定模型观察拒绝、逐次确认，以及真实验收。
import assert from 'node:assert/strict';
import { runCli } from '../../apps/coding-cli/src/main';

const mode = process.argv[2] ?? 'deny';
assert.ok(['approve', 'deny', 'edit-only'].includes(mode));
let turn = 0;
const exit = await runCli(
  ['--task', 'fixtures/code-tasks/route.json', '--approve-tools'],
  () => async ({ messages }) => {
    if (turn++ === 0) {
      return {
        role: 'assistant',
        content: '',
        stopReason: 'toolUse',
        toolCalls: [
          {
            id: 'edit',
            name: 'replace_text',
            arguments: JSON.stringify({
              path: 'src/routing/normalize.ts',
              oldText: "return path.split('?')[0]!.replace(/\\/$/, '');",
              newText: "const clean = path.split(/[?#]/)[0]!;\n  return clean.replace(/\\/+$/, '') || '/';",
            }),
          },
          { id: 'check', name: 'run_check', arguments: '{}' },
        ],
      };
    }

    for (const id of ['edit', 'check']) {
      const result = messages.find((item) =>
        item.role === 'toolResult' && item.toolCallId === id,
      );
      assert.ok(result?.role === 'toolResult');
      const approved = mode === 'approve' || (mode === 'edit-only' && id === 'edit');
      assert.equal(result.isError, !approved);
      if (!approved) {
        assert.match(result.content, /未获本次批准/);
      }
    }
    return {
      role: 'assistant',
      content: '已收到修改和验收的处理结果。',
      stopReason: 'stop',
      toolCalls: [],
    };
  },
);

assert.equal(turn, 2);
assert.equal(exit, mode === 'approve' ? 0 : 1);
