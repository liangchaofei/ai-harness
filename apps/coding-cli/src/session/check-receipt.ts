// 【新增文件】区分尚未占用、已有结果和结果不明。
import { lstat, readFile, writeFile } from 'node:fs/promises';

/** 已完成的验收写入此回执，恢复入口据此展示结果。 */
export interface CheckReceipt {
  /** 与本次检查点原文绑定的 SHA-256 摘要。 */
  checkpointKey: string;
  /** 原恢复流程判定的验收结果。 */
  passed: boolean;
  /** run_check 返回的实际反馈。 */
  feedback: string;
}

/** 有匹配回执就返回它。独占成功时返回 undefined，调用方可以启动验收。 */
export async function claimCheck(path: string, checkpointKey: string): Promise<CheckReceipt | undefined> {
  const observed = await inspectCheckReceipt(path, checkpointKey);
  if (observed.status === 'completed') return observed.receipt;
  if (observed.status === 'unknown') {
    throw new Error('验收结果不明，请核对现场。');
  }

  try {
    await writeFile(path + '.started', '', { flag: 'wx', mode: 0o600 });
    return undefined;
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) {
      throw error;
    }
  }

  const state = await inspectCheckReceipt(path, checkpointKey);
  if (state.status === 'completed') {
    return state.receipt;
  }
  throw new Error('验收已占用，但没有匹配的完成回执。结果不明，请核对现场。');
}

/** 读取时看到的证据。pending 只是观察结果，执行前仍须独占创建。 */
export type CheckReceiptState =
  | { status: 'pending' }
  | { status: 'completed'; receipt: CheckReceipt }
  | { status: 'unknown' };

async function hasEntry(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

/** 检查当前证据，不创建占用标记。 */
export async function inspectCheckReceipt(path: string, checkpointKey: string): Promise<CheckReceiptState> {
  if (!await hasEntry(path + '.started')) {
    return { status: await hasEntry(path + '.done') ? 'unknown' : 'pending' };
  }

  const receipt: unknown = await readFile(path + '.done', 'utf8')
    .then((text) => JSON.parse(text))
    .catch(() => undefined);
  if (
    typeof receipt === 'object' && receipt !== null &&
    'checkpointKey' in receipt && receipt.checkpointKey === checkpointKey &&
    'passed' in receipt && typeof receipt.passed === 'boolean' &&
    'feedback' in receipt && typeof receipt.feedback === 'string'
  ) {
    return { status: 'completed', receipt: { checkpointKey, passed: receipt.passed, feedback: receipt.feedback } };
  }

  return { status: 'unknown' };
}

/** 验收及取证结束后，独占写入一次完成回执。 */
export async function saveCheckReceipt(path: string, receipt: CheckReceipt): Promise<void> {
  await writeFile(path + '.done', JSON.stringify(receipt) + '\n', { flag: 'wx', mode: 0o600 });
}