// 【新增文件】只从固定入口中选择示例，保留原有位置参数给对应任务。
import { argv } from 'node:process';

const explicit = argv[2] === '--example';
const example = explicit ? argv[3] : 'code-review';
if (example !== 'code-review' && example !== 'release-impact') {
  console.error('示例名称无效。可选：code-review、release-impact。');
  process.exitCode = 1;
} else {
  // 移除选择器，原示例仍能从 process.argv[2] 读取任务文本。
  if (explicit) argv.splice(2, 2);
  if (example === 'code-review') {
    await import('./code-review/src/main');
  } else {
    await import('./release-impact/src/main');
  }
}
