// 【新增文件】两次运行各自建立工作副本，共用临时笔记文件。
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { runCli } from '../../apps/coding-cli/src/main';
import { createSample } from '../input-budget/sample-model';

const base = await mkdtemp(join(tmpdir(), 'ai-harness-writeback-'));
const notes = join(base, 'notes.json');
const task = join(base, 'route.json');

try {
  await writeFile(notes, '[]\n');
  await writeFile(task, JSON.stringify({
    source: resolve('fixtures/route-repair'),
    prompt: '从 src/main.ts 调查 normalizePath，按 README 修复并运行验收。',
    writablePaths: ['src/routing/normalize.ts'],
    checkScript: resolve('fixtures/code-tasks/check-route.mjs'),
    memory: { file: './notes.json', topic: 'route-repair', captureCase: '/' },
  }));

  for (const run of [1, 2]) {
    const fixedModel = createSample();
    let firstCall = true;
    const code = await runCli(['--task', task], () => (context, onDelta, signal) => {
      if (firstCall) {
        firstCall = false;
        const note = context.messages.find((message) =>
          message.role === 'user' && message.content.startsWith('应用提供的历史任务记忆'),
        );
        assert.equal(Boolean(note), run === 2);
        console.log(`第 ${run} 次任务首轮的记忆`, note?.content ?? '无');
      }
      return fixedModel(context, onDelta, signal);
    });
    assert.equal(code, 0);
    const records = JSON.parse(await readFile(notes, 'utf8'));
    assert.equal(records.length, 1);
    console.log(`第 ${run} 次任务后笔记条数`, records.length);
  }
} finally {
  await rm(base, { recursive: true, force: true });
}
