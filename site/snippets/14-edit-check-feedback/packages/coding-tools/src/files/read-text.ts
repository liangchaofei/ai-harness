// 复用原有界读取，工作区可选择最终文件不跟随链接。
import { open } from 'node:fs/promises';
import { ToolExecutionError } from '@ai-harness/runtime';

const MAX_BYTES = 16 * 1024;
const KNOWN_IO_ERRORS = new Set(['ENOENT', 'EACCES', 'EPERM', 'ENOTDIR', 'EISDIR', 'ELOOP']);

/** 工具内部读取普通文件，最多接收 16 KiB；flags 默认沿用原 r，工作区传入不跟随最终链接的标志。始终关闭句柄。 */
export async function readTextFile(target: string, signal?: AbortSignal, flags: string | number = 'r'): Promise<string> {
  try {
    // 不打开已取消的读取；已取得句柄后仍由 finally 关闭。
    signal?.throwIfAborted();
    const file = await open(target, flags);
    try {
      signal?.throwIfAborted();
      if (!(await file.stat()).isFile()) throw new ToolExecutionError('只允许读取普通文件。');
      const buffer = Buffer.alloc(MAX_BYTES + 1);
      let total = 0;
      while (total < buffer.length) {
        // FileHandle.read 不强杀；在每次有界读取前后协作退出。
        signal?.throwIfAborted();
        const { bytesRead } = await file.read(buffer, total, buffer.length - total, null);
        signal?.throwIfAborted();
        if (bytesRead === 0) break;
        total += bytesRead;
      }
      if (total > MAX_BYTES) throw new ToolExecutionError('文件超过 16 KiB，本次未返回内容。');
      return buffer.subarray(0, total).toString('utf8');
    } finally {
      await file.close();
    }
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? error.code : undefined;
    if (typeof code === 'string' && KNOWN_IO_ERRORS.has(code)) {
      throw new ToolExecutionError(`无法读取已配置文件（${code}）。`);
    }
    throw error;
  }
}
