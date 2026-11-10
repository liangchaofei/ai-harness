// 【修改】真实入口通过--plan选择可关闭策略；原默认修复流程保留。
import { createModelCall } from '../../shared/model';
import { runRepair } from './repair-run';

const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--plan') || args.length > 1) {
  console.error('修复入口参数：不传参数，或只传--plan。');
  process.exitCode = 1;
} else {
  await runRepair(createModelCall, { planning: args.includes('--plan') });
}