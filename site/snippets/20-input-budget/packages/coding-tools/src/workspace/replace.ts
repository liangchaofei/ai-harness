// 仅在应用允许的既有文件中做一次精确文本替换。
import { randomUUID } from 'node:crypto';
import { open, rename, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { ToolExecutionError, type ExecutableTool } from '@ai-harness/runtime';
import type { Workspace } from '../types/workspace';
import { objectArgument, stringField } from './arguments';

/** 写入临时同目录文件后rename；不提供任意创建、删除或整仓写入。 */
export function createReplaceTool(
  workspace: Workspace,
  writablePaths: readonly string[],
): ExecutableTool {
  const writable = new Set(writablePaths);
  return {
    name: 'replace_text',
    description: `在允许文件中精确替换唯一一处oldText；文本不要带read_file的行号。可写路径：${[...writable].join('、')}。`,
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          minLength: 1,
          maxLength: 240,
        },
        oldText: {
          type: 'string',
          minLength: 1,
          maxLength: 16384,
        },
        newText: {
          type: 'string',
          maxLength: 16384,
        },
      },
      required: ['path', 'oldText', 'newText'],
      additionalProperties: false,
    },
    async execute(value, signal) {
      signal?.throwIfAborted();
      const input = objectArgument(value, ['path', 'oldText', 'newText']);
      const path = stringField(input, 'path', 240);
      if (!writable.has(path)) {
        throw new ToolExecutionError('该文件没有写入许可。');
      }
      const oldText = stringField(input, 'oldText', 16384);
      const newText = stringField(input, 'newText', 16384, true);
      const source = await workspace.read(path, signal);
      const start = source.indexOf(oldText);
      if (start < 0 || source.indexOf(oldText, start + 1) >= 0) {
        throw new ToolExecutionError(
          'oldText必须在当前文件中精确出现一次，请重新读取后缩小替换范围。',
        );
      }
      const next =
        source.slice(0, start) + newText + source.slice(start + oldText.length);
      if (Buffer.byteLength(next, 'utf8') > 16 * 1024) {
        throw new ToolExecutionError('替换后内容超过16 KiB，未写入。');
      }
      const target = await workspace.resolve(path, signal);
      const temporary = join(dirname(target), `.agent-${randomUUID()}.tmp`);
      try {
        const file = await open(temporary, 'wx', 0o600);
        try {
          await file.writeFile(next, 'utf8');
        } finally {
          await file.close();
        }
        // 提交前再次核对当前内容；仍不是跨进程原子比较或并发写锁。
        if ((await workspace.read(path, signal)) !== source) {
          throw new ToolExecutionError('文件已变化，未覆盖，请重新读取。');
        }
        signal?.throwIfAborted();
        await rename(temporary, target);
      } finally {
        await rm(temporary, { force: true });
      }
      return JSON.stringify({
        path,
        replaced: 1,
      });
    },
  };
}
