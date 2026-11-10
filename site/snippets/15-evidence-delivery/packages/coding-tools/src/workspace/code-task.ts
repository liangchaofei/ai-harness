// 【修改】旧工具工厂保留，新增可供应用读取证据的任务会话。
import type { ExecutableTool } from '@ai-harness/runtime';
import type { CodeTaskOptions } from '../types/code-task';
import type { CheckEvidence, CodeTaskSession } from '../types/evidence';
import { openWorkspace } from './open';
import { createInvestigationTools } from './index';
import { createReplaceTool } from './replace';
import { createCheckTool } from './check';
import { prepareCheck, runCheck } from '../process/run-check';
import { captureWorkspace, compareWorkspace } from './snapshot';

/** 【新增】应用每次任务创建；同一会话只允许串行工具/inspect，不跨运行共用。 */
export async function createCodeTaskSession(options: CodeTaskOptions, signal?: AbortSignal): Promise<CodeTaskSession> {
  const command = prepareCheck(options.check);
  const writable = [...options.writablePaths];
  const workspace = await openWorkspace(options, signal);
  if (writable.length === 0 || writable.some((path) => !workspace.paths.includes(path))) {
    throw new Error('可写清单必须是索引中的既有相对路径。');
  }
  const baseline = await captureWorkspace(workspace, signal);
  let lastCheck: CheckEvidence | undefined;

  async function check(checkSignal?: AbortSignal): Promise<CheckEvidence> {
    // 先失效旧记录；后面的读取、启动或取消失败都不能沿用上次通过。
    lastCheck = undefined;
    const before = await captureWorkspace(workspace, checkSignal);
    const result = await runCheck(command, workspace.root, checkSignal);
    const after = await captureWorkspace(workspace, checkSignal);
    checkSignal?.throwIfAborted();
    const evidence = { ...result, revision: before.revision, stable: before.revision === after.revision };
    lastCheck = evidence;
    // 给工具和报告返回副本，调用者修改返回对象不会改掉私有记录。
    return { ...evidence };
  }

  return {
    tools: [...createInvestigationTools(workspace), createReplaceTool(workspace, writable), createCheckTool(check)],
    async inspect(inspectSignal) {
      const current = await captureWorkspace(workspace, inspectSignal);
      return {
        baselineRevision: baseline.revision,
        currentRevision: current.revision,
        changes: compareWorkspace(baseline, current),
        lastCheck: lastCheck ? { ...lastCheck } : undefined,
        checkMatchesCurrent: lastCheck?.stable === true && lastCheck.revision === current.revision,
      };
    },
  };
}

/** 【修改】只需要工具的旧应用继续使用；其内部也执行相同的来源记录流程。 */
export async function createCodeTaskTools(options: CodeTaskOptions, signal?: AbortSignal): Promise<ExecutableTool[]> {
  return (await createCodeTaskSession(options, signal)).tools;
}
