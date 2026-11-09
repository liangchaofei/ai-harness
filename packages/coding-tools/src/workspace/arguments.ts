// 工作区工具共用参数检查。
import { ToolExecutionError } from '@ai-harness/runtime';

// 【新增】多字段替换与零字段验收复用对象形状检查。
/** 直接调用 execute 时也拒绝多余、缺少的字段；不依赖静态类型。 */
export function objectArgument(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)
    || Object.keys(value).length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(value, key))) {
    throw new ToolExecutionError('参数字段与工具说明不符。', 'invalid_arguments');
  }
  return value as Record<string, unknown>;
}

// 【新增】替换文本允许空 newText；其他字段仍要求非空。
/** 只提取一个受长度约束的字符串；空白 oldText 也可用于精确替换。 */
export function stringField(value: Record<string, unknown>, key: string, max: number, allowEmpty = false): string {
  const text = value[key];
  if (typeof text !== 'string' || (!allowEmpty && text.length === 0) || [...text].length > max) {
    throw new ToolExecutionError(`${key} 不是符合长度要求的字符串。`, 'invalid_arguments');
  }
  return text;
}

/** Runtime 已校验 schema；保留原单字符串检查，直接调用也拒绝纯空白。 */
export function stringArgument(value: unknown, key: 'query' | 'path', max: number): string {
  // 【修改】改用共用的形状、字段检查，原调用方式保留。
  const text = stringField(objectArgument(value, [key]), key, max);
  if (!text.trim()) throw new ToolExecutionError(`${key} 不能只有空白。`, 'invalid_arguments');
  return text;
}

/** 工具说明用于生成请求，同一长度约束仍由本地检查执行。 */
export function stringParameters(key: 'query' | 'path', description: string, max: number) {
  return { type: 'object', properties: { [key]: { type: 'string', minLength: 1, maxLength: max, description } },
    required: [key], additionalProperties: false };
}