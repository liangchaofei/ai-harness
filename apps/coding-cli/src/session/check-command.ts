// 【新增文件】把可信任务的执行策略翻译成固定验收命令。
import type { CheckCommand } from '@ai-harness/coding-tools';
import type { TaskConfig } from '../types/task';

const MACOS_PROFILE = [
  '(version 1)',
  '(allow default)',
  '(deny file-write*)',
  '(deny network*)',
].join('\n');

/** 新任务与检查点恢复均使用相同策略，模型仍只提交 run_check({})。 */
export function createCheckCommand(task: TaskConfig, root: string): CheckCommand {
  const nodeArgs = ['--import', import.meta.resolve('tsx'), task.checkScript, root];

  if (task.checkIsolation === undefined) {
    return { executable: process.execPath, args: nodeArgs };
  }

  if (process.platform !== 'darwin') {
    throw new Error('macos-offline-readonly 只支持带 sandbox-exec 的 macOS。');
  }

  return {
    executable: '/usr/bin/sandbox-exec',
    args: ['-p', MACOS_PROFILE, process.execPath, ...nodeArgs],
  };
}
