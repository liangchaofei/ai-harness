// 把 CLI 选择的只读权限应用到本地工具。
import { ToolExecutionError, type ExecutableTool } from '@ai-harness/runtime';

// 新工具默认拒绝，只有明确核对过的调查工具可以执行。
// 【修改】允许已核对过的固定发票服务查询。
const readableTools = new Set([
  'find_files', 'search_source', 'read_file', 'read_source_pair', 'read_invoice_policy',
]);

/** 保留工具声明，在真正执行之前拒绝未获准的动作。 */
export function restrictToReadOnly(tools: readonly ExecutableTool[]): ExecutableTool[] {
  return tools.map((tool) => {
    if (readableTools.has(tool.name)) {
      return tool;
    }

    return {
      ...tool,
      async execute() {
        throw new ToolExecutionError('只读模式禁止执行这个工具。可继续调查并报告发现。');
      },
    };
  });
}
