// 【新增文件】模型包内部的数据判断，不依赖具体提供商或Agent状态。

/**
 * 判断未知值是否为非空、非数组的对象，供响应检查读取字段。
 * 返回true只收窄对象形状，不保证字段存在或类型正确。
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}