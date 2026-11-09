// 【新增文件】工作区工厂配置与包内共享环境。
/** 应用指定受信任的小型材料目录，工具不能自行选择另一个根目录。 */
export interface WorkspaceOptions {
  /** 绝对目录路径；工厂解析真实根目录后建立普通 .ts 文件索引。 */
  root: string;
}

/** 工厂启动时创建，三个工具共享；不从包入口导出。 */
export interface Workspace {
  /** 启动时发现的相对路径，不是源码快照；新增文件需重新创建工具。 */
  paths: readonly string[];
  /** 从索引选路径，执行时复查并有界读取；返回当前文本，不保存对话历史。 */
  read: (path: string, signal?: AbortSignal) => Promise<string>;
}