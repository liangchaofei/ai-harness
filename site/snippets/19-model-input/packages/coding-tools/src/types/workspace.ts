// 工作区工厂配置与包内共享环境。
/** 应用指定受信任的小型材料目录，工具不能自行选择另一个根目录。 */
export interface WorkspaceOptions {
  /** 绝对目录路径；工厂解析真实根目录后建立普通文件索引。 */
  root: string;
  // 文件范围由应用配置，不再为每种文本格式改扫描函数。
  /** 省略仍只读 .ts；应用配置点加1..12位小写字母或数字的后缀，如 .ts/.vue/.json/.md，区分大小写。 */
  extensions?: readonly string[];
}

/** 工厂启动时创建，所有工作区工具共享；不从包入口导出。 */
export interface Workspace {
  // 执行限定命令需要同一个实际工作目录。
  /** 规范化的实际根目录，只供包内 I/O 和进程工作目录使用。 */
  root: string;
  /** 本次已复制、检查的扩展名范围，供工具说明使用。 */
  extensions: readonly string[];
  /** 启动时发现的相对路径，不是源码快照；新增文件需重新创建工具。 */
  paths: readonly string[];
  // 读写共用路径复查，但取得位置不等于取得写入许可。
  /** 只解析索引中的精确相对路径并复查；写工具还必须检查自身允许清单。 */
  resolve: (path: string, signal?: AbortSignal) => Promise<string>;
  /** 执行时读当前文本，不保存对话历史。 */
  read: (path: string, signal?: AbortSignal) => Promise<string>;
}
