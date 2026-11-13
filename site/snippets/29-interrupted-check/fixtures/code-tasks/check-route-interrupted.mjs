// 【新增文件】给受控实验留下独立证据，再沿用原来的路径验收。
import { access, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';

const workspace = process.argv[2];
await writeFile(join(workspace, '.probe-started'), '', { flag: 'wx' });
const release = join(workspace, '.probe-release');
for (let attempt = 0; ; attempt += 1) {
  try {
    await access(release);
    break;
  } catch (error) {
    if (error.code !== 'ENOENT' || attempt >= 250) throw error;
  }
  await setTimeout(20);
}
// CLI 退出后，原验收写 stdout 时可能遇到已关闭的管道。
process.stdout.on('error', (error) => {
  if (error.code !== 'EPIPE') throw error;
});
await import('./check-route.mjs');
const pending = join(workspace, '.probe-result-tmp');
await writeFile(pending, String(process.exitCode), { flag: 'wx' });
await rename(pending, join(workspace, '.probe-finished'));
