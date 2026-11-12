import { readFile } from 'node:fs/promises';
import { isRecord } from './validation';

/** 应用提供固定文件位置；返回 ID 到非空文本的映射，不向模型开放文件路径。 */
export async function loadRecords(file: URL): Promise<ReadonlyMap<string, string>> {
  const value: unknown = JSON.parse(await readFile(file, 'utf8'));
  if (!isRecord(value)) {
    throw new Error('记录材料必须是 ID 到文本的对象。');
  }
  const records = new Map<string, string>();
  for (const [id, record] of Object.entries(value)) {
    if (!id.trim() || typeof record !== 'string' || !record.trim()) {
      throw new Error('记录 ID 和内容必须是非空文本。');
    }
    records.set(id, record);
  }
  if (records.size === 0) {
    throw new Error('记录材料不能为空。');
  }
  return records;
}
