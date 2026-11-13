// 只处理终端参数，不读取环境或启动任务。
import type { CliOptions } from '../types/task';

export const helpText = `用法：ai-harness --task <任务.json> [--plan] [--follow-up <问题>] [--session-log <文件>]
任务路径相对当前终端目录；配置内路径相对任务文件目录。
--plan 开启实验性计划；--follow-up 在首次回答后追加一条问题。
--session-log 保存本次会话到一个新文件。
--help 只显示帮助。
退出码：0已接受，1未接受，2参数/准备/报告失败，130主动取消。`;

/** main传入argv，不接受未知、重复或缺值选项。 */
export function parseArgs(args: readonly string[]): CliOptions {
  if (args.length === 1 && args[0] === '--help') {
    return { help: true };
  }
  let taskFile: string | undefined;
  let planning = false;
  let followUp: string | undefined;
  let sessionLog: string | undefined;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--plan' && !planning) {
      planning = true;
    } else if (arg === '--follow-up' && followUp === undefined) {
      // 读取一条用户追问。引号由终端处理。
      const value = args[++i]?.trim();
      if (!value || value.startsWith('--')) {
        throw new Error('追问内容缺失。');
      }
      followUp = value;
    } else if (arg === '--session-log' && sessionLog === undefined) {
      // 【新增】文件路径相对启动 CLI 时的工作目录。
      const value = args[++i];
      if (!value?.trim() || value.startsWith('--')) {
        throw new Error('会话记录路径缺失。');
      }
      sessionLog = value;
    } else if (arg === '--task' && taskFile === undefined) {
      const value = args[++i];
      if (!value?.trim() || value.startsWith('--')) {
        throw new Error('任务路径缺失。');
      }
      taskFile = value;
    } else {
      throw new Error('参数无效。');
    }
  }
  if (!taskFile) {
    throw new Error('需要任务配置。');
  }
  return {
    help: false,
    taskFile,
    planning,
    ...(followUp ? { followUp } : {}),
    ...(sessionLog ? { sessionLog } : {}),
  };
}
