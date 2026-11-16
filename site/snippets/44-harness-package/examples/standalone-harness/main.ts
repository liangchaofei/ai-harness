// 【新增文件】独立宿主只导入已安装的 Harness，运行一次真实读写与验收。
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { acceptTask, createCodeTaskSession, runAgent, type ModelCall } from '@ai-harness/harness';

const root = await mkdtemp(join(tmpdir(), 'standalone-ai-harness-'));
const writablePaths = ['total.mjs'];
const skipCheck = process.argv[2] === '--skip-check';

try {
  await writeFile(join(root, 'total.mjs'), 'export const total = (price, count) => price + count;\n');
  const session = await createCodeTaskSession({
    root,
    writablePaths,
    extensions: ['.mjs'],
    check: { executable: process.execPath, args: [resolve('check.mjs'), root] },
  });

  let turn = 0;
  const callModel: ModelCall = async () => {
    turn += 1;
    const toolCalls = turn === 1
      ? [{
          id: 'edit-total', name: 'replace_text',
          arguments: JSON.stringify({
            path: 'total.mjs',
            oldText: 'price + count',
            newText: 'price * count',
          }),
        }]
      : turn === 2 && !skipCheck ? [{ id: 'check-total', name: 'run_check', arguments: '{}' }] : [];

    return {
      role: 'assistant',
      content: toolCalls.length ? '' : '请查看实际交付结果。',
      stopReason: toolCalls.length ? 'toolUse' : 'stop',
      toolCalls,
    };
  };

  const result = await runAgent({
    messages: [{ role: 'user', content: '将总价改为单价乘以数量。' }],
    tools: session.tools,
    callModel,
    maxModelCalls: 4,
    maxToolCalls: 4,
    timeoutMs: 10_000,
  });
  const review = await session.inspect();
  const accepted = acceptTask(result, review, writablePaths);
  console.log({
    status: result.status,
    changedFiles: review.changes.map(({ path }) => path),
    checkMatchesCurrent: review.checkMatchesCurrent,
    accepted,
  });
  process.exitCode = accepted ? 0 : 1;
} finally {
  await rm(root, { recursive: true, force: true });
}
