// 【新增文件】模型只能请求运行已配置验收，不能提交shell命令。
import type { ExecutableTool } from '@ai-harness/runtime';
import type { CheckCommand, CheckResult } from '../types/code-task';
import type { Workspace } from '../types/workspace';
import { runCheck } from '../process/run-check';
import { objectArgument } from './arguments';

/** 非零退出也是程序实际结果，作为正常工具内容反馈给下一轮。 */
export function createCheckTool(workspace: Workspace, command: CheckCommand): ExecutableTool {
  return {
    name: 'run_check',
    description: '运行应用预设的验收程序，参数为{}；检查status、exitCode及stdout/stderr，用失败反馈决定下一步。',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    async execute(value, signal) {
      objectArgument(value, []);
      const result: CheckResult = await runCheck(command, workspace.root, signal);
      return JSON.stringify(result);
    },
  };
}
