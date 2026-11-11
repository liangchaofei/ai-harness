// 【新增文件】待修复的当前实现，供Agent调查和修改。
/** 应用调用它把页面路径转换为不带查询和片段的匹配路径。 */
export function normalizePath(path: string): string {
  return path.split('?')[0]!.replace(/\/$/, '');
}
