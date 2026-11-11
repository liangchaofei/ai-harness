// 固定观察复用真实CLI；不加载密钥、不访问模型服务。
import { runCli } from '../../apps/coding-cli/src/main';
import { createSample } from './sample-model';
import type { Scenario } from './types/scenario';

const args = process.argv.slice(2);
const selected = args[0] ?? 'repair';

if (args.length > 1 || !['repair', 'stale', 'recheck'].includes(selected)) {
  console.error('固定观察参数：repair、stale或recheck，默认repair。');
  process.exitCode = 2;
} else {
  const scenario = selected as Scenario;
  process.exitCode = await runCli(['--task', 'fixtures/code-tasks/route.json'], () =>
    createSample(scenario),
  );
}
