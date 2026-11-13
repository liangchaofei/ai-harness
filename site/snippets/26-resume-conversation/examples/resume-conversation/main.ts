// 【新增文件】固定模型只根据上一进程写入的验收反馈回答。
import { runCli } from '../../apps/coding-cli/src/main';

const file = process.argv[2];
if (!file) {
  throw new Error('请指定第 25 篇生成的日志。');
}
const question = '修正后最后一次验收的结果是什么？';

process.exitCode = await runCli(['--resume-log', file, '--follow-up', question], () =>
  async (context) => {
    const check = context.messages.find((message) =>
      message.role === 'toolResult' && message.toolCallId === 'check_complete',
    );
    if (!check || JSON.parse(check.content).status !== 'passed' ||
        context.tools?.length || context.messages.at(-1)?.content !== question) {
      throw new Error('缺少历史验收证据，或只读接续的输入不符合预期。');
    }
    return {
      role: 'assistant',
      content: '日志中最后一次验收通过，依据是 check_complete。',
      stopReason: 'stop',
      toolCalls: [],
    };
  },
);
