// 【修改】选择器新增 workspace-review，start/debug 脚本不变。
import { argv } from 'node:process';

const explicit = argv[2] === '--example';
const example = explicit ? argv[3] : 'code-review';
if (example !== 'code-review' && example !== 'release-impact' && example !== 'workspace-review') {
  console.error('示例名称无效。可选：code-review、release-impact、workspace-review。');
  process.exitCode = 1;
} else {
  // 移除选择器，原示例仍能从 process.argv[2] 读取任务文本。
  if (explicit) argv.splice(2, 2);
  if (example === 'code-review') {
    await import('./code-review/src/main');
  } else if (example === 'release-impact') {
    await import('./release-impact/src/main');
  } else {
    // 【新增】选择工作区入口，不改变原有默认任务与参数位置。
    await import('./code-review/src/workspace-main');
  }
}
