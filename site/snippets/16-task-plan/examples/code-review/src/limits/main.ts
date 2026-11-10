// 无需 Key 的期限/额度对照，使用真实 Runtime 和文件读取。
import { runAgent } from '@ai-harness/runtime';
import { reviewTools } from '../tools';
import { printEvent } from '../../../shared/print-event';
import { printRun } from '../../../shared/print-run';
import { createLimitScenario } from './scenario';

const mode = process.argv[2] ?? 'time';
if (!['time', 'tools', 'calls', 'normal', 'cancel', 'late'].includes(mode)) {
  throw new Error('模式为 time、tools、calls、normal、cancel 或 late。');
}
const readTool = reviewTools[0];
if (!readTool) throw new Error('缺少示例读取工具。');
const scenario = createLimitScenario(readTool, mode);
const controller = new AbortController();
let timer: ReturnType<typeof setTimeout> | undefined;

try {
  const result = await runAgent({
    messages: [{ role: 'user', content: '本地固定预算观察。' }],
    tools: scenario.tools,
    callModel: scenario.callModel,
    maxModelCalls: mode === 'calls' ? 1 : 3,
    maxToolCalls: mode === 'tools' ? 2 : 3,
    timeoutMs: mode === 'time' || mode === 'late' ? 200 : 2_000,
    signal: controller.signal,
    onEvent(event) {
      printEvent(event);
      // 先保留第一次读取，再在第二次模型等待中主动取消，与到期对照。
      if (mode === 'cancel' && event.type === 'model_start' && event.modelCall === 2) {
        timer = setTimeout(() => controller.abort(), 10);
      }
    },
  });
  printRun(result);
  console.log('实际文件读取次数：', scenario.readCount());
  const expected = mode === 'time' || mode === 'late' ? 'timedOut'
    : mode === 'tools' ? 'toolLimit' : mode === 'calls' ? 'callLimit'
    : mode === 'cancel' ? 'cancelled' : 'answered';
  if (result.status !== expected) process.exitCode = 1;
} finally {
  clearTimeout(timer);
}
