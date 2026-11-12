// 【新增文件】观察资料命中或未命中，既不启动 Agent，也不修改文件。
import { fileURLToPath } from 'node:url';
import { loadTaskMemory } from '../../apps/coding-cli/src/context/task-memory';

const topic = process.argv[2] ?? 'route-repair';
const base = fileURLToPath(new URL('../../fixtures/code-tasks/', import.meta.url));
const memory = await loadTaskMemory({ file: 'task-memory.json', topic }, base);
console.log(memory ?? '没有匹配的任务记忆');
