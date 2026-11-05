// 应用只配置可读材料，复用能力包里的工具实现。
import { fileURLToPath } from 'node:url';
import { createReadFileTool } from '@ai-harness/coding-tools';

export const reviewTools = [createReadFileTool({
  files: {
    'src/cart.ts': fileURLToPath(new URL('../../../fixtures/code-review/src/cart.ts', import.meta.url)),
  },
})];
