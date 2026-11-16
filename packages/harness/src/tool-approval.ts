// 【新增文件】CLI 和桌面共用的工具执行前批准包装。
import { ToolExecutionError, type ExecutableTool } from '@ai-harness/runtime';

/** 应用为这次实际工具调用取得决策，回调由各宿主实现。 */
export interface ToolApprovalRequest {
  /** 工作区的修改和验收工具需要逐次批准。 */
  toolName: 'replace_text' | 'run_check';
  /** Runtime 已完成结构校验，实际工具仍执行语义与范围检查。 */
  args: unknown;
}

/** 只在本次获准后调用原执行函数。只读调查仍沿用原行为。 */
export function wrapToolsWithApproval(
  tools: readonly ExecutableTool[],
  approve: (request: ToolApprovalRequest, signal?: AbortSignal) => Promise<boolean>,
): ExecutableTool[] {
  return tools.map((tool) => {
    const toolName = tool.name;
    if (toolName !== 'replace_text' && toolName !== 'run_check') {
      return tool;
    }

    return {
      ...tool,
      async execute(args, signal) {
        signal?.throwIfAborted();
        const approved = await approve({ toolName, args }, signal);
        signal?.throwIfAborted();
        if (!approved) {
          throw new ToolExecutionError('该工具请求未获本次批准。');
        }
        return tool.execute(args, signal);
      },
    };
  });
}
