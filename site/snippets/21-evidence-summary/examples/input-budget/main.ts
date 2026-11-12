// 【新增文件】同一任务观察自动保留与选择；固定模型，不访问网络。
import { runCli } from '../../apps/coding-cli/src/main';
import { createSample } from './sample-model';

process.exitCode = await runCli(
  ['--task', 'fixtures/code-tasks/route.json'],
  () => createSample(),
);
