// 【新增文件】三个工作区工具共用单字符串参数检查。
import { ToolExecutionError } from '@ai-harness/runtime';

/** Runtime 已校验 schema；直接调用工具时仍拒绝不符合约定的对象。 */
export function stringArgument(value: unknown, key: 'query' | 'path', max: number): string {
  if (typeof value !== 'object' || value === null || Array.isArray(value)
    || Object.keys(value).length !== 1 || !(key in value)) {
    throw new ToolExecutionError(`参数必须只包含字符串 ${key}。`, 'invalid_arguments');
  }
  const text = (value as Record<string, unknown>)[key];
  if (typeof text !== 'string' || !text.trim() || text.length > max) {
    throw new ToolExecutionError(`${key} 必须为非空字符串，长度不超过 ${max}。`, 'invalid_arguments');
  }
  return text;
}

/** 工具说明用于生成请求，同一长度约束仍由本地检查执行。 */
export function stringParameters(key: 'query' | 'path', description: string, max: number) {
  return { type: 'object', properties: { [key]: { type: 'string', minLength: 1, maxLength: max, description } },
    required: [key], additionalProperties: false };
}