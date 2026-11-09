// 公开具体代码能力，不把文件读取放进 Runtime。
export type { ReadFileOptions } from './types/read-file';
export { createReadFileTool } from './read-file';

// 【新增】工作区能力与旧清单读取并存，由应用选择一组工具。
export type { WorkspaceOptions } from './types/workspace';
export { createWorkspaceTools } from './workspace';