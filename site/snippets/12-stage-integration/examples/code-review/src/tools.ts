// 【修改】保留默认工具清单，允许任务工厂提供另一份路径到文件的映射。
import { fileURLToPath } from 'node:url';
import { createReadFileTool } from '@ai-harness/coding-tools';

/** 应用声明当前任务可读材料；实际读取与边界检查仍由 coding-tools 实现。 */
export function createReviewTools(files: Readonly<Record<string, string>>) {
  return [createReadFileTool({ files })];
}

/** 原有示例和早期观察入口继续使用这份默认工具。 */
export const reviewTools = createReviewTools({
  'src/cart.ts': fileURLToPath(new URL('../../../fixtures/code-review/src/cart.ts', import.meta.url)),
});
