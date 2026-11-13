// 【新增文件】在另一个进程里查看每行记录的概要。
import { readFile } from 'node:fs/promises';

const path = process.argv[2];
if (!path) {
  throw new Error('请提供会话日志文件路径。');
}

const lines = (await readFile(path, 'utf8')).trimEnd().split('\n');
for (const line of lines) {
  const entry = JSON.parse(line);
  if (entry.type === 'session') {
    console.log('会话版本', entry.version);
  } else if (entry.type === 'run') {
    console.log('运行', entry.status, '新增消息', entry.messages.length);
  }
}
