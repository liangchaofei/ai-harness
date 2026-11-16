// 【新增文件】用路径实际行为判断桌面任务是否通过。
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { normalize } = await import(pathToFileURL(join(process.argv[2], 'route.mjs')).href);
const passed = normalize('/') === '/' && normalize('/docs///?q=1') === '/docs' &&
  normalize('/docs/#intro') === '/docs';
console.log(JSON.stringify({ passed }));
process.exitCode = passed ? 0 : 1;
