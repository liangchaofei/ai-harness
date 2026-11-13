// 【新增文件】从可信材料建立一次独立代码任务，不依赖示例目录。
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCodeTaskSession } from '@ai-harness/coding-tools';
import { createPlanSession } from '@ai-harness/runtime';
import type { TaskConfig } from '../types/task';
import type { CliSession } from '../types/session';

/** main传入解析后配置；准备失败清理半成品，成功后由main保留副本。 */
export async function prepareSession(
  task: TaskConfig,
  planning: boolean,
  signal?: AbortSignal,
): Promise<CliSession> {
  signal?.throwIfAborted();
  const root = await mkdtemp(join(tmpdir(), 'ai-harness-cli-'));
  try {
    await cp(task.source, root, {
      recursive: true,
      dereference: false,
    });
    // 本篇只接独立、无依赖的小型ESM教学材料，不覆盖来源中的包配置。
    await writeFile(join(root, 'package.json'), '{"type":"module"}\n', { flag: 'wx' });
    signal?.throwIfAborted();
    const codeTask = await openTaskWorkspace(task, root, signal);
    return {
      root,
      codeTask,
      plan: planning ? createPlanSession() : undefined,
    };
  } catch (error) {
    await rm(root, {
      recursive: true,
      force: true,
    });
    throw error;
  }
}

/** 从指定副本重新建立工具会话，供新任务与检查点恢复共用。 */
export function openTaskWorkspace(task: TaskConfig, root: string, signal?: AbortSignal) {
  return createCodeTaskSession(
    {
      root,
      extensions: ['.ts', '.json', '.md'],
      writablePaths: task.writablePaths,
      check: {
        executable: process.execPath,
        args: ['--import', import.meta.resolve('tsx'), task.checkScript, root],
      },
    },
    signal,
  );
}
