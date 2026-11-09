// 【新增文件】逐文件读取当前文本，返回包含字面量的行与位置。
import type { ExecutableTool } from '@ai-harness/runtime';
import type { Workspace } from '../types/workspace';
import { stringArgument, stringParameters } from './arguments';

/** 最多 20 条命中，每条预览 240 字符；任何文件读取失败都不冒充完整搜索。 */
export function createSearchTool(workspace: Workspace): ExecutableTool {
  return {
    name: 'search_source',
    description: '在工作区 .ts 文件内容中查找区分大小写的字面量，不支持正则；返回路径、1起始行号及预览，最多20条。',
    parameters: stringParameters('query', '需要匹配的源码文字。', 120),
    async execute(value, signal) {
      signal?.throwIfAborted();
      const query = stringArgument(value, 'query', 120);
      const matches: { path: string; line: number; text: string; lineTruncated: boolean }[] = [];
      for (const path of workspace.paths) {
        signal?.throwIfAborted();
        const source = await workspace.read(path, signal);
        const lines = source.split(/\r?\n/);
        for (let index = 0; index < lines.length; index += 1) {
          const text = lines[index]!;
          if (!text.includes(query)) continue;
          if (matches.length === 20) return JSON.stringify({ matches, truncated: true });
          matches.push({ path, line: index + 1, text: text.slice(0, 240), lineTruncated: text.length > 240 });
        }
      }
      return JSON.stringify({ matches, truncated: false });
    },
  };
}
