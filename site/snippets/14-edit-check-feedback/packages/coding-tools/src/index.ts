// 公开具体代码能力，不把文件读取放进 Runtime。
export type { ReadFileOptions } from './types/read-file';
export { createReadFileTool } from './read-file';

// 工作区能力与旧清单读取并存，由应用选择一组工具。
export type { WorkspaceOptions } from './types/workspace';
export { createWorkspaceTools } from './workspace';

// 【新增】代码任务的编辑与限定验收能力，原只读入口保留。
export { createCodeTaskTools } from './workspace/code-task';
export type { CodeTaskOptions, CheckCommand, CheckResult } from './types/code-task';
