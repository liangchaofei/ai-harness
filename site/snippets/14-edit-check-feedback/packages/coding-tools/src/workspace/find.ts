// 只搜索已建立的相对路径索引，不读取源码。
import type { ExecutableTool } from '@ai-harness/runtime';
import type { Workspace } from '../types/workspace';
import { stringArgument, stringParameters } from './arguments';

/** 模型提供区分大小写的路径子串；最多返回 20 项，并说明是否还有结果。 */
export function createFindTool(workspace: Workspace): ExecutableTool {
  return {
    name: 'find_files',
    // 【修改】说明本次实际文本范围，不再写死 TS。
    description: `按相对路径子串查找普通文本文件，区分大小写，不支持 glob；最多20项。范围：${workspace.extensions.join('、')}。`,
    parameters: stringParameters('query', '需要匹配的相对路径文字。', 120),
    async execute(value, signal) {
      signal?.throwIfAborted();
      const query = stringArgument(value, 'query', 120);
      const matches = workspace.paths.filter((path) => path.includes(query));
      return JSON.stringify({ paths: matches.slice(0, 20), truncated: matches.length > 20 });
    },
  };
}
