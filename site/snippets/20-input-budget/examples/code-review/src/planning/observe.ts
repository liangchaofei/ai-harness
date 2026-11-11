// 在相同材料和预算下观察计划开启/关闭，不读取.env或调用服务。
import { performance } from 'node:perf_hooks';
import { runRepair } from '../repair-run';
import { logBlock } from '../../../shared/terminal';
import { createPlanSample } from './sample-model';

const args = process.argv.slice(2);
if (
  args.some((arg) => !['--plan', '--false-complete'].includes(arg)) ||
  new Set(args).size !== args.length ||
  (args.includes('--false-complete') && !args.includes('--plan'))
) {
  throw new Error('观察参数：可选--plan；反例同时加--false-complete。');
}
const planning = args.includes('--plan');
let modelCalls = 0;
let contextBytes = 0;
const started = performance.now();
await runRepair(
  () => {
    const sample = createPlanSample(planning, args.includes('--false-complete'));
    return async (context, preview, signal) => {
      modelCalls += 1;
      contextBytes += Buffer.byteLength(JSON.stringify(context), 'utf8');
      return sample(context, preview, signal);
    };
  },
  { planning },
);
logBlock('固定观察开销', {
  planning,
  modelCalls,
  contextBytes,
  elapsedMs: Math.round(performance.now() - started),
  note: 'contextBytes为累计项目Context的UTF-8字节，不是token、网络请求体或费用；决策预写。',
});
