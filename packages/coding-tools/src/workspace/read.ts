// 从工作区索引选择文件，返回全文与可引用行号。
import type { ExecutableTool } from '@ai-harness/runtime';
import type { Workspace } from '../types/workspace';
import { stringArgument, stringParameters } from './arguments';

/** 与清单工具同名，但按任务二选一注册；本工具只在内容行前增加行号。 */
export function createWorkspaceReadTool(workspace: Workspace): ExecutableTool {
  return {
    name: 'read_file',
    // 【修改】读取应用允许的文本文件，原行号与大小边界保留。
    description: `读取普通文本文件，源内容最大16 KiB，返回1起始行号；仅接受索引内相对路径。范围：${workspace.extensions.join('、')}。`,
    parameters: stringParameters('path', '从查找结果或已知入口取得的实际相对路径。', 240),
    async execute(value, signal) {
      const path = stringArgument(value, 'path', 240);
      const source = await workspace.read(path, signal);
      return `${path}\n${source.split(/\r?\n/).map((line, index) => `${index + 1}: ${line}`).join('\n')}`;
    },
  };
}