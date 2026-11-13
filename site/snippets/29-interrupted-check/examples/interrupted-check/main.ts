// 【新增文件】只中断本脚本启动的恢复 CLI，并核对磁盘证据。
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout } from 'node:timers/promises';

const dir = await mkdtemp(join(tmpdir(), 'ai-harness-interrupt-'));
const checkpoint = join(dir, 'pending.json');
const taskFile = join(dir, 'route.json');
const original = JSON.parse(await readFile('fixtures/code-tasks/route.json', 'utf8'));
await writeFile(taskFile, JSON.stringify({
  ...original,
  source: resolve('fixtures/route-repair'),
  checkScript: resolve('fixtures/code-tasks/check-route-interrupted.mjs'),
}));
console.log('实验目录', dir);

function start(mode: 'save' | 'resume') {
  const child = spawn(process.execPath, [
    '--import', 'tsx', 'examples/checkpoint/main.ts', mode, checkpoint, taskFile,
  ], { stdio: 'inherit' });
  const closed = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(
    (resolveClose, reject) => {
      child.once('error', reject);
      child.once('close', (code, signal) => resolveClose({ code, signal }));
    },
  );
  return { child, closed };
}

async function waitForFile(path: string): Promise<void> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    try {
      await access(path);
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    await setTimeout(20);
  }
  throw new Error(`等待证据文件超时：${path}`);
}

assert.equal((await start('save').closed).code, 0);
const { workspace } = JSON.parse(await readFile(checkpoint, 'utf8'));
const running = start('resume');

try {
  await waitForFile(join(workspace, '.probe-started'));
  assert.equal(running.child.kill('SIGKILL'), true);
  assert.equal((await running.closed).signal, 'SIGKILL');
  console.log('恢复 CLI 被中断，子进程已启动');
} finally {
  if (running.child.exitCode === null && running.child.signalCode === null) {
    running.child.kill('SIGKILL');
  }
  await running.closed;
}

await writeFile(join(workspace, '.probe-release'), '', { flag: 'wx' });
await waitForFile(join(workspace, '.probe-finished'));
const exitCodeText = await readFile(join(workspace, '.probe-finished'), 'utf8');
assert.equal(exitCodeText, '0');
await access(checkpoint + '.started');
await assert.rejects(access(checkpoint + '.done'), { code: 'ENOENT' });
console.log('验收脚本记录通过，但 CLI 没有完成回执');

assert.equal((await start('resume').closed).code, 2);
console.log('重新提交被拒绝，保留实验目录和工作副本供检查');
