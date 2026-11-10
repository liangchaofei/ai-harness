// 公开具体代码能力，不把文件读取放进 Runtime。
export type { ReadFileOptions } from './types/read-file';
export { createReadFileTool } from './read-file';

// 工作区能力与旧清单读取并存，由应用选择一组工具。
export type { WorkspaceOptions } from './types/workspace';
export { createWorkspaceTools } from './workspace';

// 代码任务的编辑与限定验收能力，原只读入口保留。
// 【修改】兼容旧工厂，同时公开带停止后取证的会话。
export { createCodeTaskTools, createCodeTaskSession } from './workspace/code-task';
// 【新增】公开审阅契约，内部WorkspaceSnapshot不公开。
export type { CodeTaskSession, CodeTaskReview, FileChange, CheckEvidence } from './types/evidence';
export type { CodeTaskOptions, CheckCommand, CheckResult } from './types/code-task';
