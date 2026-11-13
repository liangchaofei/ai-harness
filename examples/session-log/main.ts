// 【新增文件】固定模型执行路径修复和追问，退出后可查看日志。
import { runCli } from '../../apps/coding-cli/src/main';
import { createSample } from '../input-budget/sample-model';

const file = process.argv[2];
if (!file) {
  throw new Error('请提供会话日志文件路径。');
}
const question = '最后一次实际验收结果是什么？';

process.exitCode = await runCli(
  ['--task', 'fixtures/code-tasks/route.json', '--follow-up', question, '--session-log', file],
  () => {
    const sample = createSample();
    return (context, onDelta, signal) => {
      if (!context.messages.some((message) => message.role === 'user' && message.content === question)) {
        return sample(context, onDelta, signal);
      }

      const check = context.messages.find((message) =>
        message.role === 'toolResult' && message.toolCallId === 'check_complete',
      );
      if (!check || JSON.parse(check.content).status !== 'passed') {
        throw new Error('追问缺少实际验收反馈。');
      }
      return Promise.resolve({
        role: 'assistant',
        content: '最后一次验收通过，依据是 check_complete。',
        stopReason: 'stop',
        toolCalls: [],
      });
    };
  },
);