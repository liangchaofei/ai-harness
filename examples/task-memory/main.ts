// 【新增文件】观察外部线索是否送达，再用第 20 篇的固定模型完成实际验收。
import { runCli } from '../../apps/coding-cli/src/main';
import { createSample } from '../input-budget/sample-model';

const useMemory = process.argv[2] !== 'baseline';
const task = useMemory ? 'route-memory' : 'route';
const sample = createSample();

process.exitCode = await runCli(
  ['--task', `fixtures/code-tasks/${task}.json`],
  () => async (context, onDelta, signal) => {
    const memories = context.messages.filter((message) =>
      message.role === 'user' && message.content.startsWith('应用提供的历史任务记忆'),
    );
    const note = memories[0];
    if (memories.length !== Number(useMemory)) {
      throw new Error('本轮记忆条数与任务配置不符。');
    }
    if (note && !note.content.includes('"topic":"route-repair"')) {
      throw new Error('本轮收到了不适用的任务记忆。');
    }

    console.log('固定模型收到的记忆', note?.content ?? '无');
    return sample(context, onDelta, signal);
  },
);