// 固定模型选择，配合实际工具验证反馈修正与过期验收。
import type { Context, ToolCall, ToolResultMessage } from '@ai-harness/model';
import type { ModelCall } from '@ai-harness/runtime';

/** 检查模型下一轮确实收到相同ID的实际反馈，不伪造验收通过。 */
function requireCheck(context: Context, id: string, status: 'failed' | 'passed'): void {
  const message = context.messages.find(
    (item): item is ToolResultMessage =>
      item.role === 'toolResult' && item.toolCallId === id,
  );
  if (!message || message.isError || JSON.parse(message.content).status !== status) {
    throw new Error('固定观察没有收到预期的实际验收反馈。');
  }
}

/** 这里只构造项目工具请求；是否执行由原Runtime决定。 */
function request(id: string, name: string, args: unknown): ToolCall {
  return { id, name, arguments: JSON.stringify(args) };
}

/** 每次工厂调用有独立轮次；固定原文与修正不表示真实模型能自主找到答案。 */
export function createSample(): ModelCall {
  let turn = 0;

  return async (context) => {
    turn += 1;
    let calls: ToolCall[] = [];

    if (turn === 1) {
      calls = [
        request('read_entry', 'read_file', { path: 'src/main.ts' }),
        request('read_current', 'read_file', { path: 'src/routing/normalize.ts' }),
      ];
    } else if (turn === 2) {
      calls = [
        request('edit_partial', 'replace_text', {
          path: 'src/routing/normalize.ts',
          oldText: "return path.split('?')[0]!.replace(/\\/$/, '');",
          newText: "return path.split(/[?#]/)[0]!.replace(/\\/+$/, '');",
        }),
        request('check_partial', 'run_check', {}),
      ];
    } else if (turn === 3) {
      requireCheck(context, 'check_partial', 'failed');
      calls = [
        request('edit_complete', 'replace_text', {
          path: 'src/routing/normalize.ts',
          oldText: "return path.split(/[?#]/)[0]!.replace(/\\/+$/, '');",
          newText:
            "const clean = path.split(/[?#]/)[0]!;\n  return clean.replace(/\\/+$/, '') || '/';",
        }),
        request('check_complete', 'run_check', {}),
      ];
    } else if (turn === 4) {
      requireCheck(context, 'check_complete', 'passed');

    }

    return {
      role: 'assistant',
      content: calls.length
        ? ''
        : '固定观察：按页面路径规则修正；交付由当前内容与实际验收判断。',
      stopReason: calls.length ? 'toolUse' : 'stop',
      toolCalls: calls,
    };
  };
}