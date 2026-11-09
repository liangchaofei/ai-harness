// 【新增文件】同一任务组装在固定 HTTP 或真实模型上运行，分别显示停止与任务接受。
import { performance } from 'node:perf_hooks';
import { runAgent } from '@ai-harness/runtime';
import { createReviewTask } from '../code-review/src/task';
import { createReleaseTask } from '../release-impact/src/task';
import { createModelCall } from '../shared/model';
import { createStreamingModelCall } from '../shared/stream-model';
import { printEvent } from '../shared/print-event';
import { createInterrupt } from '../shared/interrupt';
import { logBlock } from '../shared/terminal';
import { createStageFetch } from './fixtures/fetch';

const selected = process.argv[2] ?? 'review';
const provider = process.argv[3] ?? 'deepseek';
const mode = process.argv[4] ?? 'normal';
if (selected !== 'review' && selected !== 'release') throw new Error('任务为 review 或 release。');
if (provider !== 'deepseek' && provider !== 'anthropic') throw new Error('服务为 deepseek 或 anthropic。');
if (!['normal', 'recover', 'cutoff', 'cancel', 'deadline', 'budget', 'live'].includes(mode)) {
  throw new Error('模式为 normal、recover、cutoff、cancel、deadline、budget 或 live。');
}
if (mode === 'live' && (process.env.MODEL_PROVIDER?.trim() || 'deepseek') !== provider) {
  throw new Error('live 的服务参数必须与 MODEL_PROVIDER 一致。');
}
const controller = new AbortController();
const interrupt = createInterrupt();
let timer: ReturnType<typeof setTimeout> | undefined;
let previewChars = 0;
let observerFaultSent = false;

try {
  const task = selected === 'review' ? createReviewTask('invoice') : await createReleaseTask('stage');
  const sample = createStageFetch(selected, provider, mode);
  const callModel = mode === 'live' ? createModelCall() : createStreamingModelCall({
    provider, apiKey: 'local-placeholder', model: 'local-sample', fetch: sample.fetch,
  });
  const started = performance.now();
  const result = await runAgent({
    ...task.input, callModel,
    maxModelCalls: 6,
    maxToolCalls: mode === 'budget' ? 1 : 8,
    timeoutMs: mode === 'deadline' ? 200 : 60_000,
    // 终端取消与本地装置取消都交给本次 Runtime，来源仍由应用持有。
    signal: AbortSignal.any([controller.signal, interrupt.signal]),
    onEvent(event) {
      printEvent(event);
      if (event.type !== 'model_text_delta') return;
      previewChars += event.text.length;
      if (mode === 'recover' && !observerFaultSent) {
        observerFaultSent = true;
        throw new Error('固定装置：模拟一次预览展示故障。');
      }
      if (mode === 'cancel' && sample.isFinalResponse() && !timer) {
        timer = setTimeout(() => controller.abort(), 10);
      }
    },
  });
  const elapsedMs = Math.round(performance.now() - started);
  const accepted = task.report(result);
  const expected: Record<string, string> = {
    normal: 'answered', recover: 'answered', cutoff: 'failed',
    cancel: 'cancelled', deadline: 'timedOut', budget: 'toolLimit', live: 'answered',
  };
  const matches = result.status === expected[mode];
  logBlock('阶段联调摘要', {
    task: task.id, provider, source: mode === 'live' ? '真实模型服务' : '固定 HTTP 响应', mode,
    status: result.status, modelCalls: result.modelCalls, toolCalls: result.toolCalls,
    observerErrors: result.observerErrors, previewChars, elapsedMs,
    taskAccepted: accepted, expectedPath: mode === 'live' ? '不适用' : matches,
  });
  console.log('任务接受只检查停止状态与成功材料证据，答案含义仍需核对。');
  if (!matches || (['normal', 'recover', 'live'].includes(mode) && !accepted)) process.exitCode = 1;
} catch {
  console.error('联调配置、材料或展示发生异常；未输出原始异常正文，请在入口断点检查。');
  process.exitCode = 1;
} finally {
  clearTimeout(timer);
  interrupt.dispose();
}