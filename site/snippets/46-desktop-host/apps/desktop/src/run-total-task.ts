// 【新增文件】主进程执行一份可信的总价修复任务。
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { createCodeTaskRunner, createCodeTaskSession, type ModelCall } from '@ai-harness/harness';
import type { DesktopTaskEvent, DesktopTaskResult } from './types/task';

const checkScript = fileURLToPath(new URL('../check-total.mjs', import.meta.url));

/** 运行器使用真实编辑和验收。固定模型让页面交互可以稳定复现。 */
export async function runTotalTask(
  signal: AbortSignal,
  publish: (event: DesktopTaskEvent) => void,
): Promise<DesktopTaskResult> {
  const node = process.env.npm_node_execpath;
  if (!node || !isAbsolute(node)) {
    throw new Error('请通过 npm run desktop:start 启动应用。');
  }

  const root = await mkdtemp(join(tmpdir(), 'ai-harness-desktop-'));
  const writablePaths = ['total.mjs'];
  try {
    await writeFile(join(root, 'total.mjs'), 'export const total = (price, count) => price + count;\n');
    const session = await createCodeTaskSession({
      root,
      writablePaths,
      extensions: ['.mjs'],
      check: { executable: node, args: [checkScript, root] },
    }, signal);
    const runner = createCodeTaskRunner(session, writablePaths);
    let turn = 0;
    const callModel: ModelCall = async (_context, _delta, modelSignal) => {
      turn += 1;
      if (turn === 1) {
        return request('edit-total', 'replace_text', {
          path: 'total.mjs', oldText: 'price + count', newText: 'price * count',
        });
      }
      if (turn === 2) {
        // 固定响应留出可操作的取消窗口，不延迟真实模型。
        await delay(1_200, undefined, { signal: modelSignal });
        return request('check-total', 'run_check', {});
      }
      return { role: 'assistant', content: '请查看验收结果。', stopReason: 'stop', toolCalls: [] };
    };

    const result = await runner.run({
      messages: [{ role: 'user', content: '将总价修复为单价乘以数量。' }],
      callModel,
      signal,
      maxModelCalls: 4,
      maxToolCalls: 3,
      timeoutMs: 10_000,
      onEvent(event) {
        if (event.type === 'model_start') {
          publish({ sequence: event.sequence, label: `模型调用 ${event.modelCall}` });
        } else if (event.type === 'tool_end') {
          const verb = event.toolName === 'replace_text' ? '修改文件' : '执行验收';
          publish({ sequence: event.sequence, label: `${verb}${event.isError ? '失败' : '完成'}` });
        }
      },
    });
    // 运行取消后，仍可独立审阅已经完成的文件副作用。
    const { review, accepted } = await runner.review(result);
    return {
      status: result.status,
      checkMatchesCurrent: review.checkMatchesCurrent,
      checkPassed: review.checkMatchesCurrent && review.lastCheck?.status === 'passed' &&
        review.lastCheck.exitCode === 0,
      accepted,
      changedFiles: review.changes.map(({ path }) => path),
    };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

/** 使用与真实模型相同的工具请求契约。 */
function request(id: string, name: string, args: Record<string, unknown>) {
  return {
    role: 'assistant',
    content: '',
    stopReason: 'toolUse',
    toolCalls: [{ id, name, arguments: JSON.stringify(args) }],
  } as const;
}
