// 【新增文件】当前调查示例创建查询工具所需的配置。
/** 应用加载材料后创建；工厂复制记录映射，Runtime 只读取说明并调用 execute。 */
export interface LookupToolOptions {
  /** 模型请求时使用的名称，例如 lookup_release。 */
  name: string;
  /** 查询用途，不在说明中提前放入调查结果。 */
  description: string;
  /** 告诉模型应该提供哪一种记录 ID。 */
  idDescription: string;
  /** 应用读取的 ID 到文本映射；不包含执行或状态管理能力。 */
  records: ReadonlyMap<string, string>;
}