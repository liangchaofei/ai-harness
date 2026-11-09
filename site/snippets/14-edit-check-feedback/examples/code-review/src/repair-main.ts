// 【新增文件】真实模型入口，共用同一个修复运行过程。
import { createModelCall } from '../../shared/model';
import { runRepair } from './repair-run';

await runRepair(createModelCall);
