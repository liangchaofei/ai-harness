// 【新增文件】验证临时副本，stdout 输出共享交付规则读取的 JSON。
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { total } = await import(pathToFileURL(join(process.argv[2], 'total.mjs')).href);
const passed = total(8, 3) === 24 && total(8, 0) === 0;
console.log(JSON.stringify({ passed }));
process.exitCode = passed ? 0 : 1;
