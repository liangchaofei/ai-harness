// 【新增文件】保存并读取主进程生成的桌面审阅记录。
import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { mkdir, open, readdir, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import type { DesktopRunRecord } from './types/task';

const MAX_BYTES = 256 * 1024;
const MAX_VISIBLE = 12;
const idPattern = /^\d{13}-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const recordSchema = z.object({
  version: z.literal(1),
  id: z.string().regex(idPattern),
  finishedAt: z.iso.datetime(),
  taskId: z.enum(['total', 'route']),
  modelMode: z.enum(['fixed', 'live']),
  events: z.array(z.object({ sequence: z.number().int().positive(), label: z.string() })).max(20),
  result: z.object({
    status: z.enum(['answered', 'callLimit', 'truncated', 'emptyAnswer', 'failed', 'cancelled', 'timedOut', 'toolLimit']),
    accepted: z.boolean(),
    checkMatchesCurrent: z.boolean(),
    checkPassed: z.boolean(),
    changedFiles: z.array(z.string()).max(1),
    changes: z.array(z.object({ path: z.string(), before: z.string(), after: z.string() })).max(1),
    check: z.object({
      status: z.enum(['passed', 'failed', 'timedOut', 'outputLimit']),
      exitCode: z.number().int().nullable(),
    }).nullable(),
  }),
});

export class DesktopHistoryError extends Error {}

/** 写完临时文件后再发布最终文件名，列表只读取已发布记录。 */
export async function saveRun(directory: string, run: Omit<DesktopRunRecord, 'version' | 'id' | 'finishedAt'>) {
  try {
    const finished = new Date();
    const id = `${String(finished.getTime()).padStart(13, '0')}-${randomUUID()}`;
    const record = recordSchema.parse({ ...run, version: 1, id, finishedAt: finished.toISOString() });
    const data = JSON.stringify(record) + '\n';
    if (Buffer.byteLength(data) > MAX_BYTES) {
      throw new Error('记录超过大小限制。');
    }

    await mkdir(directory, { recursive: true, mode: 0o700 });
    const temporary = join(directory, id + '.tmp');
    const file = await open(temporary, 'wx', 0o600);
    try {
      try {
        await file.writeFile(data);
      } finally {
        await file.close();
      }
      await rename(temporary, join(directory, id + '.json'));
    } finally {
      await rm(temporary, { force: true });
    }
  } catch {
    throw new DesktopHistoryError('任务已结束，但无法保存本次运行记录。');
  }
}

/** 只接受本模块生成的 ID，不接受渲染器提交的文件路径。 */
export async function readRun(directory: string, id: unknown): Promise<DesktopRunRecord> {
  if (typeof id !== 'string' || !idPattern.test(id)) {
    throw new DesktopHistoryError('运行记录 ID 无效。');
  }
  try {
    const file = await open(join(directory, id + '.json'), constants.O_RDONLY | constants.O_NONBLOCK | constants.O_NOFOLLOW);
    try {
      if (!(await file.stat()).isFile()) {
        throw new Error('不是普通记录文件。');
      }
      const chunks: Buffer[] = [];
      for await (const chunk of file.createReadStream({ end: MAX_BYTES, autoClose: false })) {
        chunks.push(chunk);
      }
      const data = Buffer.concat(chunks);
      if (data.length > MAX_BYTES) {
        throw new Error('记录超过大小限制。');
      }
      const record = recordSchema.parse(JSON.parse(data.toString('utf8')));
      if (record.id !== id) {
        throw new Error('记录身份不匹配。');
      }
      return record;
    } finally {
      await file.close();
    }
  } catch {
    throw new DesktopHistoryError('无法读取这条运行记录。');
  }
}

/** 返回最近十二个可见候选的摘要，坏记录不阻塞同批的其他记录。 */
export async function listRuns(directory: string) {
  const files = await readdir(directory).catch((error: unknown) => {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw new DesktopHistoryError('无法读取运行历史。');
  });
  const ids = files.filter((file) => file.endsWith('.json'))
    .map((file) => file.slice(0, -5))
    .filter((id) => idPattern.test(id))
    .sort().reverse().slice(0, MAX_VISIBLE);
  const results = await Promise.allSettled(ids.map((id) => readRun(directory, id)));
  return results.flatMap((item) => {
    if (item.status === 'rejected') {
      return [];
    }
    const { id, finishedAt, taskId, modelMode, result } = item.value;
    return [{ id, finishedAt, taskId, modelMode, status: result.status, accepted: result.accepted }];
  });
}
