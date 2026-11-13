// 【新增文件】用临时文件观察占用与完成回执。
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { claimCheck, saveCheckReceipt } from '../../apps/coding-cli/src/session/check-receipt';

const dir = await mkdtemp(join(tmpdir(), 'check-receipt-'));
try {
  const path = join(dir, 'pending.json');
  const key = '本地观察';
  console.log('首次占用', await claimCheck(path, key));
  try {
    await claimCheck(path, key);
  } catch (error) {
    console.log(error instanceof Error ? error.message : error);
  }
  await saveCheckReceipt(path, { checkpointKey: key, passed: true, feedback: '人工示意' });
  console.log('再次读取', await claimCheck(path, key));
} finally {
  await rm(dir, { recursive: true, force: true });
}