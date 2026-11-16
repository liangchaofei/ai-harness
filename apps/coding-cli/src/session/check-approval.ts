// 【新增文件】在检查点旁记录操作者对这一次验收的决定。
import { readFile, writeFile } from 'node:fs/promises';
import type { CheckDecision } from '../types/task';

/** 当前检查点的批准状态。旧检查点由调用方单独处理。 */
export type CheckApproval = 'waiting' | 'approved' | 'denied';

/** 只接受与当前检查点原文匹配、状态合法的决定记录。 */
export async function readCheckApproval(
  path: string,
  checkpointKey: string,
  signal?: AbortSignal,
): Promise<CheckApproval> {
  let text: string;
  try {
    text = await readFile(path + '.approval', { encoding: 'utf8', signal });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return 'waiting';
    }
    throw error;
  }

  const record: unknown = JSON.parse(text);
  if (typeof record !== 'object' || record === null ||
      !('checkpointKey' in record) || record.checkpointKey !== checkpointKey ||
      !('decision' in record) || (record.decision !== 'approve' && record.decision !== 'deny')) {
    throw new Error('批准记录无效或与当前检查点不匹配。');
  }
  return record.decision === 'approve' ? 'approved' : 'denied';
}

/** 只允许第一份决定写入。重复提交不会覆盖已有决定。 */
export async function saveCheckApproval(
  path: string,
  checkpointKey: string,
  decision: CheckDecision,
  signal?: AbortSignal,
): Promise<void> {
  signal?.throwIfAborted();
  await writeFile(path + '.approval', JSON.stringify({ checkpointKey, decision }) + '\n', {
    flag: 'wx',
    mode: 0o600,
  });
}
