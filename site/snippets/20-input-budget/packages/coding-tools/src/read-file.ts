// 受配置清单限制的实际文件读取工具。
// 原读取逻辑迁到包内共用文件，清单工具的公开用法不变。
import { readTextFile } from './files/read-text';
import { ToolExecutionError, type ExecutableTool } from '@ai-harness/runtime';
import type { ReadFileOptions } from './types/read-file';

/** 应用创建工具；模型只收到说明，Runtime 才能调用 execute。 */
export function createReadFileTool(options: ReadFileOptions): ExecutableTool {
  const files = new Map(Object.entries(options.files));
  return {
    name: 'read_file',
    description: `读取一个已允许的 UTF-8 源码文件。可用路径：${[...files.keys()].join('、')}。`,
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '从可用路径中选择一项。',
        },
      },
      required: ['path'],
      additionalProperties: false,
    },
    // 接收 Runtime 传入的信号，继续传给文件读取。
    async execute(value: unknown, signal?: AbortSignal): Promise<string> {
      if (
        typeof value !== 'object' ||
        value === null ||
        Array.isArray(value) ||
        !('path' in value) ||
        typeof value.path !== 'string' ||
        Object.keys(value).length !== 1
      ) {
        throw new ToolExecutionError('参数必须是只包含字符串 path 的对象。');
      }
      const target = files.get(value.path);
      if (target === undefined) {
        throw new ToolExecutionError('该路径不在应用允许的文件清单中。');
      }
      const source = await readTextFile(target, signal);
      return `${value.path}\n${source}`;
    },
  };
}
