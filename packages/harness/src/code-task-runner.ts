// 【新增文件】协调已经准备好的任务会话、运行阶段与交付审阅。
import type { CodeTaskSession } from '@ai-harness/coding-tools';
import { runAgent, type RunResult } from '@ai-harness/runtime';
import { acceptTask } from './accept-task';
import type { CodeTaskRunner } from './types/code-task-runner';

/** 绑定当前副本和允许修改的路径，宿主仍负责准备与清理。 */
export function createCodeTaskRunner(
  session: CodeTaskSession,
  writablePaths: readonly string[],
): CodeTaskRunner {
  const allowedPaths = [...writablePaths];
  let busy = false;
  let latest: RunResult | undefined;

  return {
    async run(options) {
      if (busy) {
        throw new Error('代码任务正在运行或审阅。');
      }

      busy = true;
      latest = undefined;
      try {
        const result = await runAgent({ ...options, tools: options.tools ?? session.tools });
        latest = result;
        return result;
      } finally {
        busy = false;
      }
    },

    async review(result, signal) {
      if (busy) {
        throw new Error('代码任务正在运行或审阅。');
      }
      if (result !== latest) {
        throw new Error('只允许审阅此任务最近一次运行的结果。');
      }

      busy = true;
      try {
        const review = await session.inspect(signal);
        return { review, accepted: acceptTask(result, review, allowedPaths) };
      } finally {
        busy = false;
      }
    },
  };
}
