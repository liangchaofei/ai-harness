// 【新增文件】独立宿主提供可信验收，只读取任务副本的计算结果。
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { total } = await import(pathToFileURL(join(process.argv[2], 'total.mjs')).href);
const passed = total(8, 3) === 24 && total(8, 0) === 0;
console.log(JSON.stringify({ passed }));
process.exitCode = passed ? 0 : 1;
