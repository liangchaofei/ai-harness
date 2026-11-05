import { ToolExecutionError, type ExecutableTool } from '@ai-harness/runtime';
import type { LookupToolOptions } from './types/tools';
import { isRecord } from './validation';

/** 应用注入记录清单；模型按 ID 查询，成功返回 id/record 的 JSON 文本。 */
export function createLookupTool(options: LookupToolOptions): ExecutableTool {
  const records = new Map(options.records);
  return {
    name: options.name,
    description: options.description,
    parameters: {
      type: 'object',
      properties: { id: { type: 'string', description: options.idDescription } },
      required: ['id'],
      additionalProperties: false,
    },
    async execute(value: unknown): Promise<string> {
      if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim()
        || Object.keys(value).length !== 1) {
        throw new ToolExecutionError('参数必须是只包含非空字符串 id 的对象。');
      }
      const record = records.get(value.id);
      if (record === undefined) {
        throw new ToolExecutionError('没有找到该 ID 的记录，请核对任务或已有查询结果中的标识。');
      }
      return JSON.stringify({ id: value.id, record });
    },
  };
}
