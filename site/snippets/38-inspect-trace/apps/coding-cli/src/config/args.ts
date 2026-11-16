// 只处理终端参数，不读取环境或启动任务。
import type { CheckDecision, CliOptions } from '../types/task';

export const helpText = `用法：ai-harness --task <任务.json> [--plan] [--read-only | --approve-tools] [--follow-up <问题>] [--session-log <文件>] [--trace-file <新文件>] [--checkpoint <文件> [--gate-check]]
ai-harness --task <任务.json> --resume-check <检查点>
ai-harness --task <任务.json> --inspect-check <检查点>
ai-harness --task <任务.json> --decide-check <检查点> <approve|deny>
ai-harness --resume-log <文件> --follow-up <问题>
ai-harness --inspect-trace <轨迹文件>
任务路径相对当前终端目录；配置内路径相对任务文件目录。
--plan 开启实验性计划；--follow-up 在首次回答后追加一条问题。
--read-only 只允许调查工具；--approve-tools 在修改或验收前逐次询问。
--gate-check 让保存的检查点等待人工批准，准备阶段暂不提供验收工具。
--trace-file 在新任务运行时保存结构化事件。
--help 只显示帮助。
退出码：0已接受，1未接受，2参数/准备/报告失败，130主动取消。`;

/** main传入argv，不接受未知、重复或缺值选项。 */
export function parseArgs(args: readonly string[]): CliOptions {
  if (args.length === 1 && args[0] === '--help') {
    return { help: true };
  }
  // 【新增】离线诊断只接受一个路径，独立于任务参数。
  if (args[0] === '--inspect-trace') {
    const path = args[1];
    if (args.length !== 2 || !path?.trim() || path.startsWith('--')) {
      throw new Error('轨迹诊断只接受一个文件路径。');
    }
    return { help: false, inspectTrace: path };
  }
  let taskFile: string | undefined;
  let planning = false;
  let readOnly = false;
  let approveTools = false;
  let followUp: string | undefined;
  let sessionLog: string | undefined;
  let traceFile: string | undefined;
  let resumeLog: string | undefined;
  let checkpoint: string | undefined;
  let resumeCheck: string | undefined;
  let inspectCheck: string | undefined;
  // 保存时声明门禁，决定时另收路径和动作。
  let gateCheck = false;
  let decideCheck: { path: string; decision: CheckDecision } | undefined;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--plan' && !planning) {
      planning = true;
    } else if (arg === '--read-only' && !readOnly) {
      readOnly = true;
    } else if (arg === '--approve-tools' && !approveTools) {
      approveTools = true;
    } else if (arg === '--follow-up' && followUp === undefined) {
      // 读取一条用户追问。引号由终端处理。
      const value = args[++i]?.trim();
      if (!value || value.startsWith('--')) {
        throw new Error('追问内容缺失。');
      }
      followUp = value;
    } else if (arg === '--session-log' && sessionLog === undefined) {
      // 文件路径相对启动 CLI 时的工作目录。
      const value = args[++i];
      if (!value?.trim() || value.startsWith('--')) {
        throw new Error('会话记录路径缺失。');
      }
      sessionLog = value;
    } else if (arg === '--trace-file' && traceFile === undefined) {
      // 路径由操作者提供，后续只允许新建文件。
      const value = args[++i];
      if (!value?.trim() || value.startsWith('--')) {
        throw new Error('诊断轨迹路径缺失。');
      }
      traceFile = value;
    } else if (arg === '--resume-log' && resumeLog === undefined) {
      const value = args[++i];
      if (!value?.trim() || value.startsWith('--')) {
        throw new Error('会话日志路径缺失。');
      }
      resumeLog = value;
    } else if (arg === '--checkpoint' && checkpoint === undefined) {
      const value = args[++i];
      if (!value?.trim() || value.startsWith('--')) {
        throw new Error('检查点路径缺失。');
      }
      checkpoint = value;
    } else if (arg === '--resume-check' && resumeCheck === undefined) {
      const value = args[++i];
      if (!value?.trim() || value.startsWith('--')) {
        throw new Error('恢复检查点路径缺失。');
      }
      resumeCheck = value;
    } else if (arg === '--inspect-check' && inspectCheck === undefined) {
      const value = args[++i];
      if (!value?.trim() || value.startsWith('--')) {
        throw new Error('检查点诊断路径缺失。');
      }
      inspectCheck = value;
    } else if (arg === '--gate-check' && !gateCheck) {
      gateCheck = true;
    } else if (arg === '--decide-check' && decideCheck === undefined) {
      const path = args[++i];
      const decision = args[++i];
      if (!path?.trim() || path.startsWith('--') || (decision !== 'approve' && decision !== 'deny')) {
        throw new Error('批准决定需要检查点路径以及 approve 或 deny。');
      }
      decideCheck = { path, decision };
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
  if (resumeLog) {
    if (approveTools || readOnly || taskFile || sessionLog || traceFile || planning || checkpoint || resumeCheck || inspectCheck || gateCheck || decideCheck || !followUp) {
      throw new Error('只读接续需要且仅接受日志路径和一条追问。');
    }
    return { help: false, resumeLog, question: followUp };
  }
  if (!taskFile) {
    throw new Error('需要任务配置。');
  }
  // 这些入口不会启动任务模型循环。
  if (traceFile && (resumeCheck || inspectCheck || decideCheck)) {
    throw new Error('诊断轨迹只支持新任务运行。');
  }
  // 决定只写记录，不能与保存、运行或恢复混在一次调用中。
  if (gateCheck && !checkpoint) {
    throw new Error('--gate-check 需要 --checkpoint。');
  }
  if (decideCheck && (checkpoint || resumeCheck || inspectCheck || planning ||
      followUp || sessionLog || readOnly || approveTools)) {
    throw new Error('批准决定只接受任务配置、检查点路径和决定。');
  }
  if (approveTools && (readOnly || checkpoint || resumeCheck || inspectCheck)) {
    throw new Error('逐次批准不能与只读或检查点选项混用。');
  }
  if (readOnly && (planning || checkpoint || resumeCheck || inspectCheck)) {
    throw new Error('只读任务不能与计划或检查点选项混用。');
  }
  if (inspectCheck && (checkpoint || resumeCheck || followUp || planning || sessionLog)) {
    throw new Error('检查点诊断只接受任务配置与检查点路径。');
  }
  if ((checkpoint || resumeCheck) && (followUp || (resumeCheck && (checkpoint || planning || sessionLog)))) {
    throw new Error('检查点选项不能与当前参数组合。');
  }
  return {
    help: false,
    taskFile,
    planning,
    ...(readOnly ? { readOnly } : {}),
    ...(approveTools ? { approveTools } : {}),
    ...(followUp ? { followUp } : {}),
    ...(sessionLog ? { sessionLog } : {}),
    ...(traceFile ? { traceFile } : {}),
    ...(checkpoint ? { checkpoint } : {}),
    ...(gateCheck ? { gateCheck } : {}),
    ...(decideCheck ? { decideCheck } : {}),
    ...(resumeCheck ? { resumeCheck } : {}),
    ...(inspectCheck ? { inspectCheck } : {}),
  };
}
