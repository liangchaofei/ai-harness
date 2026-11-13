// 【新增文件】同一任务、同一追问，对照全量历史与自动输入策略。
import type { Message } from '@ai-harness/model';
import { messageBytes } from '../../apps/coding-cli/src/context/select-input';
import { runCli } from '../../apps/coding-cli/src/main';
import { createModelCall } from '../../apps/coding-cli/src/model';
import { createSample } from '../input-budget/sample-model';

const mode = process.argv[2] ?? 'managed';
const service = process.argv[3];
if ((mode !== 'managed' && mode !== 'full') || (service !== undefined && service !== '--live')) {
  throw new Error('请选择 managed 或 full。可加 --live 连接已配置的模型服务。');
}

const question = '第一次验收是哪个用例失败？请给出当前运行的依据，并说明最后一次验收结果。';
const metrics = { calls: 0, messageBytesTotal: 0, followUpBytes: 0 };

interface FailureEvidence {
  /** 固定验收脚本报告的失败用例输入。 */
  input: string;
  /** 证据在本轮输入中采用的形式，便于对照两种策略。 */
  source: '原始反馈' | '验收摘要';
}

/** 从固定示例的当前验收中寻找失败用例。 */
function readFailure(messages: readonly Message[]): FailureEvidence | undefined {
  const raw = messages.find((message) =>
    message.role === 'toolResult' && message.toolCallId === 'check_partial',
  );
  if (raw) {
    const result = JSON.parse(raw.content);
    const report = JSON.parse(result.stdout);
    const input = report.cases.find((item: { passed: boolean; input: string }) => !item.passed)?.input;
    return typeof input === 'string' ? { input, source: '原始反馈' } : undefined;
  }

  const summary = messages.find((message) =>
    message.role === 'user' && message.content.startsWith('应用生成的历史验收摘要'),
  );
  if (summary) {
    const evidence = JSON.parse(summary.content.split('\n')[1]!);
    if (evidence.omitted.id === 'check_partial' && typeof evidence.omitted.failedInput === 'string') {
      return { input: evidence.omitted.failedInput, source: '验收摘要' };
    }
  }

  return undefined;
}

const exitCode = await runCli(
  ['--task', 'fixtures/code-tasks/route-memory.json', '--follow-up', question],
  () => {
    const sample = service === '--live' ? createModelCall() : createSample();

    return async (context, onDelta, signal) => {
      const bytes = messageBytes(context.messages);
      const isFollowUp = context.messages.some((message) =>
        message.role === 'user' && message.content === question,
      );
      metrics.calls += 1;
      metrics.messageBytesTotal += bytes;
      if (isFollowUp) {
        metrics.followUpBytes += bytes;
      }

      if (service === '--live' || !isFollowUp) {
        return sample(context, onDelta, signal);
      }

      const failure = readFailure(context.messages);
      const lastCheck = context.messages.find((message) =>
        message.role === 'toolResult' && message.toolCallId === 'check_complete',
      );
      if (failure?.input !== '/' || !lastCheck || JSON.parse(lastCheck.content).status !== 'passed') {
        throw new Error('本轮没有足够的当前验收依据。');
      }

      console.log('追问证据', failure);
      return {
        role: 'assistant',
        content: '第一次验收的失败用例是 /，依据是 check_partial。check_complete 显示最终通过。',
        stopReason: 'stop',
        toolCalls: [],
      };
    };
  },
  mode === 'full',
);
console.log('模型输入对照', { mode, ...metrics });
process.exitCode = exitCode;
