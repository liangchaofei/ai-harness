// 【新增文件】用临时笔记观察写入与更新，验收对象为人工样本。
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CodeTaskReview } from '@ai-harness/coding-tools';
import { loadTaskMemory } from '../../apps/coding-cli/src/context/task-memory';
import { saveAcceptedMemory } from '../../apps/coding-cli/src/context/save-memory';

const base = await mkdtemp(join(tmpdir(), 'ai-harness-memory-'));
const file = 'notes.json';
const path = join(base, file);
const topic = 'route-repair';
const capture = { path, topic, caseInput: '/' };

/** 构造已经通过的单用例报告，revision 用于区分两份人工证据。 */
function review(expected: string, revision: string): CodeTaskReview {
  return {
    baselineRevision: 'before',
    currentRevision: revision,
    changes: [],
    checkMatchesCurrent: true,
    lastCheck: {
      status: 'passed',
      exitCode: 0,
      stdout: JSON.stringify({
        passed: true,
        cases: [{ input: '/', expected, actual: expected, passed: true }],
      }),
      stderr: '',
      stable: true,
      revision,
    },
  };
}

try {
  await writeFile(path, '[]\n');
  const first = review('/', 'sample-v1');
  console.log('首次写入', await saveAcceptedMemory(capture, first, 'check-route.mjs'));
  console.log('重复写入', await saveAcceptedMemory(capture, first, 'check-route.mjs'));
  const updated = review('/home', 'sample-v2');
  console.log('用新证据更新', await saveAcceptedMemory(capture, updated, 'check-route.mjs'));
  console.log('重新读取', await loadTaskMemory({ file, topic }, base));
} finally {
  await rm(base, { recursive: true, force: true });
}
