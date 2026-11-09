// 【新增文件】应用选择根目录，一次准备供三个工具共享的工作区。
import type { ExecutableTool } from '@ai-harness/runtime';
import type { WorkspaceOptions } from '../types/workspace';
import { openWorkspace } from './open';
import { createFindTool } from './find';
import { createSearchTool } from './search';
import { createWorkspaceReadTool } from './read';

/** 在启动 Agent 前建立索引；signal 控制准备阶段，运行阶段仍使用 execute 的信号。 */
export async function createWorkspaceTools(options: WorkspaceOptions, signal?: AbortSignal): Promise<ExecutableTool[]> {
  const workspace = await openWorkspace(options, signal);
  return [createFindTool(workspace), createSearchTool(workspace), createWorkspaceReadTool(workspace)];
}