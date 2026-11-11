// 无需 Key 的取消观察；固定决策和 HTTP，真实 Runtime 与文件读取。
import { runAgent } from '@ai-harness/runtime';
import { createStreamingModelCall } from '../../../shared/stream-model';
import { printEvent } from '../../../shared/print-event';
import { printRun } from '../../../shared/print-run';
import { reviewTools } from '../tools';
import { createWaitingFetch, createToolScenario } from './fixtures';

const mode = process.argv[2] ?? 'model';
const provider = process.argv[3] ?? 'deepseek';
if (!['model', 'tools', 'late'].includes(mode)) throw new Error('模式为 model、tools 或 late。');
if (provider !== 'deepseek' && provider !== 'anthropic') throw new Error('服务为 deepseek 或 anthropic。');
const cancel = !process.argv.includes('--no-cancel');
const controller = new AbortController();
const readTool = reviewTools[0];
if (!readTool) throw new Error('缺少示例读取工具。');
const scenario = createToolScenario(readTool, controller, mode === 'late', cancel);
const callModel = mode === 'model'
  ? createStreamingModelCall({ provider, apiKey: 'local-placeholder', model: 'local-sample',
      fetch: createWaitingFetch(provider) })
  : scenario.callModel;
let timer: ReturnType<typeof setTimeout> | undefined;

try {
  const result = await runAgent({
    messages: [{ role: 'user', content: '本地固定取消观察。' }],
    tools: scenario.tools,
    callModel,
    maxModelCalls: 3,
    signal: controller.signal,
    onEvent(event) {
      printEvent(event);
      // 第一段预览后发起取消；此时读取器将进入下一次响应体等待。
      if (mode === 'model' && cancel && event.type === 'model_text_delta' && !timer) {
        timer = setTimeout(() => controller.abort(), 20);
      }
    },
  });
  printRun(result);
  console.log('实际文件读取次数：', scenario.readCount());
  // 正常对照的 answered 也只是固定流程完成，不是实际任务质量通过。
  if (result.status !== (cancel ? 'cancelled' : 'answered')) process.exitCode = 1;
} finally {
  clearTimeout(timer);
}
