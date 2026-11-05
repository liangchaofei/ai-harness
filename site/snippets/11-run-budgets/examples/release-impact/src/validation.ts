/** 供材料加载、工具参数和结果读取复用；只排除非对象、null 和数组。 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
