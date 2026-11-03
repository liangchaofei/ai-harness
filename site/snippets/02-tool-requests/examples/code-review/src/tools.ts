// #region full
// 【新增文件】示例向模型说明可请求的动作；本篇没有文件读取实现。
import type { ToolDefinition } from '@ai-harness/model';

/** 应用创建工具说明，模型包将它发送给服务。 */
export const reviewTools: readonly ToolDefinition[] = [{
  name: 'read_file',
  description: '请求指定项目相对路径的代码文件内容，用于审查尚未提供的源码。',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: '需要读取的项目相对路径，例如src/cart.ts。' },
    },
    required: ['path'],
    additionalProperties: false,
  },
}];
// #endregion full
