// 【新增文件】只比较最后一轮是否能从输入找到早期失败证据。
import { runCli } from '../../apps/coding-cli/src/main';
import { createSample } from '../input-budget/sample-model';

const mode = process.argv[2] ?? 'summary';
if (mode !== 'summary' && mode !== 'cut-only') {
  throw new Error('请选择 summary 或 cut-only。');
}

let round = 0;
const sample = createSample();
process.exitCode = await runCli(['--task', 'fixtures/code-tasks/route.json'], () =>
  async (context, onDelta, signal) => {
    round += 1;
    if (round !== 4) return sample(context, onDelta, signal);

    // 对照组只移除摘要；保留完全相同的近期批次。
    const isSummary = (content: string) => content.startsWith('应用生成的历史验收摘要');
    const messages = mode === 'cut-only'
      ? context.messages.filter((message) => !isSummary(message.content))
      : context.messages;
    if (messages.some((m) => m.role === 'toolResult' && m.toolCallId === 'check_partial')) {
      throw new Error('对照无效：原始失败反馈没有被省略。');
    }

    const summary = messages.find((message) => isSummary(message.content));
    const evidence = summary && JSON.parse(summary.content.split('\n')[1]!);
    if (evidence?.omitted?.id !== 'check_partial' ||
        typeof evidence.omitted.failedInput !== 'string') {
      console.log('早期失败用例：本轮输入没有依据');
      throw new Error('不能回答第一次失败的是哪个用例。');
    }

    console.log('早期失败用例', {
      input: evidence.omitted.failedInput,
      index: evidence.omitted.index,
      id: evidence.omitted.id,
    });
    return sample({ ...context, messages }, onDelta, signal);
  },
);
