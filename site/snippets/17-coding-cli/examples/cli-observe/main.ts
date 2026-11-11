// 【新增文件】只替换模型连接，实际复用CLI参数、配置、副本、运行和报告。
import { runCli } from '../../apps/coding-cli/src/main';
import { createSample } from './sample-model';

process.exitCode = await runCli(process.argv.slice(2), createSample);
