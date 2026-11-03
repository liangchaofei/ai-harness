// 【新增文件】由应用配置的读取范围，不由模型指定磁盘根目录。
/** 创建 read_file 时传入；工厂复制此映射，后续请求只能选择其中的键。 */
export interface ReadFileOptions {
  /** 模型可见的路径 → 应用选定的本地绝对路径；只配置可公开的普通练习文件。 */
  files: Readonly<Record<string, string>>;
}