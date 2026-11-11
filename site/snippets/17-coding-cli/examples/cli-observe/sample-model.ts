// 【新增文件】固定动作观察CLI接线；不是模型自主调查或修复。
import type { ModelCall } from '@ai-harness/runtime';

/** 每次工厂调用创建自己的计数；工具、文件I/O和验收进程均实际执行。 */
export function createSample(): ModelCall {
  let turn = 0;
  return async (context) => {
    turn += 1;
    const call = (id: string, name: string, args: unknown) => ({
      id,
      name,
      arguments: JSON.stringify(args),
    });
    const planned = context.tools?.some((tool) => tool.name === 'update_plan') === true;
    const calls =
      turn === 1
        ? [call('read', 'read_file', { path: 'src/cart.ts' })]
        : turn === 2
          ? [
              ...(planned
                ? [
                    call('plan', 'update_plan', {
                      expectedRevision: 0,
                      explanation: '固定演示取得实际源码后登记',
                      steps: [
                        {
                          step: '修复并验收',
                          status: 'in_progress',
                        },
                      ],
                    }),
                  ]
                : []),
              call('edit', 'replace_text', {
                path: 'src/cart.ts',
                oldText: 'sum + item.price, 0',
                newText: 'sum + item.price * item.quantity, 0',
              }),
              call('check', 'run_check', {}),
            ]
          : turn === 3 && planned
            ? [
                call('done', 'update_plan', {
                  expectedRevision: 1,
                  explanation: '固定演示收到实际验收通过后登记',
                  steps: [
                    {
                      step: '修复并验收',
                      status: 'completed',
                    },
                  ],
                }),
              ]
            : [];
    if (turn >= 3) {
      const check = context.messages.find(
        (message) => message.role === 'toolResult' && message.toolCallId === 'check',
      );
      if (
        !check ||
        check.role !== 'toolResult' ||
        check.isError ||
        JSON.parse(check.content).status !== 'passed'
      ) {
        throw new Error('固定观察没有收到预期的实际验收。');
      }
    }
    return {
      role: 'assistant',
      content: calls.length ? '' : '固定观察：已补上数量，实际验收通过。',
      stopReason: calls.length ? 'toolUse' : 'stop',
      toolCalls: calls,
    };
  };
}
