// 受配置清单限制的实际文件读取工具。
import { open } from 'node:fs/promises';
import { ToolExecutionError, type ExecutableTool } from '@ai-harness/runtime';
import type { ReadFileOptions } from './types/read-file';

const MAX_BYTES = 16 * 1024;
const KNOWN_IO_ERRORS = new Set(['ENOENT', 'EACCES', 'EPERM', 'ENOTDIR', 'EISDIR']);

/** 工具内部读取普通文件，最多接收 16 KiB，始终关闭文件句柄。 */
async function readAllowedFile(target: string): Promise<string> {
  try {
    const file = await open(target, 'r');
    try {
      if (!(await file.stat()).isFile()) throw new ToolExecutionError('只允许读取普通文件。');
      const buffer = Buffer.alloc(MAX_BYTES + 1);
      let total = 0;
      while (total < buffer.length) {
        const { bytesRead } = await file.read(buffer, total, buffer.length - total, null);
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

/** 应用创建工具；模型只收到说明，Runtime 才能调用 execute。 */
export function createReadFileTool(options: ReadFileOptions): ExecutableTool {
  const files = new Map(Object.entries(options.files));
  return {
    name: 'read_file',
    description: `读取一个已允许的 UTF-8 源码文件。可用路径：${[...files.keys()].join('、')}。`,
    parameters: {
      type: 'object',
      properties: { path: { type: 'string', description: '从可用路径中选择一项。' } },
      required: ['path'],
      additionalProperties: false,
    },
    async execute(value: unknown): Promise<string> {
      if (typeof value !== 'object' || value === null || Array.isArray(value)
        || !('path' in value) || typeof value.path !== 'string'
        || Object.keys(value).length !== 1) {
        throw new ToolExecutionError('参数必须是只包含字符串 path 的对象。');
      }
      const target = files.get(value.path);
      if (target === undefined) throw new ToolExecutionError('该路径不在应用允许的文件清单中。');
      const source = await readAllowedFile(target);
      return `${value.path}\n${source}`;
    },
  };
}
