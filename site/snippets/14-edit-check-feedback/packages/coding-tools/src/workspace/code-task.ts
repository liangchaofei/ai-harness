// 【新增文件】同一工作区组合调查、指定文件替换与限定验收。
import type { ExecutableTool } from '@ai-harness/runtime';
import type { CodeTaskOptions } from '../types/code-task';
import { openWorkspace } from './open';
import { createInvestigationTools } from './index';
import { createReplaceTool } from './replace';
import { createCheckTool } from './check';
import { prepareCheck } from '../process/run-check';

/** 应用必须传工作副本位置；库不会自行复制目录，也不承诺OS隔离。 */
export async function createCodeTaskTools(options: CodeTaskOptions, signal?: AbortSignal): Promise<ExecutableTool[]> {
  const command = prepareCheck(options.check);
  const writable = [...options.writablePaths];
  const workspace = await openWorkspace(options, signal);
  if (writable.length === 0 || writable.some((path) => !workspace.paths.includes(path))) {
    throw new Error('可写清单必须是索引中的既有相对路径。');
  }
  return [...createInvestigationTools(workspace), createReplaceTool(workspace, writable), createCheckTool(workspace, command)];
}
