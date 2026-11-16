// 【新增文件】只在临时副本探测读取、创建文件和监听回环端口。
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { join } from 'node:path';

const root = process.argv[2];
const entry = await readFile(join(root, 'src/main.ts'), 'utf8');
const marker = join(root, 'isolation-probe.tmp');
let write = 'allowed';
try {
  await writeFile(marker, 'probe', { flag: 'wx' });
} catch (error) {
  write = error.code ?? 'unknown';
}
if (write === 'allowed') {
  await unlink(marker);
}

const listen = await new Promise((resolve) => {
  const server = createServer();
  server.once('error', (error) => resolve(error.code ?? 'unknown'));
  server.listen(0, '127.0.0.1', () => server.close(() => resolve('allowed')));
});

console.log(JSON.stringify({ readEntry: entry.includes('invoiceTotal'), write, listen }));
