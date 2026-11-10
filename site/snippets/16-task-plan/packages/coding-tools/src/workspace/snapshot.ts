// 采集有限文本范围，计算内容标识和基线差异。
import { createHash } from 'node:crypto';
import type { Workspace } from '../types/workspace';
import type { FileChange, WorkspaceSnapshot } from '../types/evidence';
import { openWorkspace } from './open';

/** 工厂、验收前后和停止后共用；范围变化就停止取证，不交付半份内容。 */
export async function captureWorkspace(workspace: Workspace, signal?: AbortSignal): Promise<WorkspaceSnapshot> {
  const current = await openWorkspace({ root: workspace.root, extensions: workspace.extensions }, signal);
  if (current.root !== workspace.root) throw new Error('工作区实际根目录已变化，请重新准备任务会话。');
  if (JSON.stringify(current.paths) !== JSON.stringify(workspace.paths)) {
    throw new Error('工作区文件清单已变化，请重新准备任务会话。');
  }
  const files: [string, string][] = [];
  for (const path of workspace.paths) {
    files.push([path, await current.read(path, signal)]);
  }
  signal?.throwIfAborted();
  // JSON数组保留路径/内容边界；不把两段原文直接相连造成歧义。
  const revision = createHash('sha256').update(JSON.stringify(files), 'utf8').digest('hex');
  return { files, revision };
}

/** 只比较同一会话的固定文件清单；返回完整原文，不伪装成可应用补丁。 */
export function compareWorkspace(before: WorkspaceSnapshot, after: WorkspaceSnapshot): FileChange[] {
  const originals = new Map(before.files);
  return after.files.flatMap(([path, text]) => {
    const original = originals.get(path);
    if (original === undefined) throw new Error('不能比较不同文件范围的快照。');
    return original === text ? [] : [{ path, before: original, after: text }];
  });
}
