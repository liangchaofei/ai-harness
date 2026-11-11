// 终端参数与已解析任务的应用契约。
/** 参数解析器创建；main据此选择帮助或加载配置，不发起模型调用。 */
export type CliOptions =
  { help: true } | { help: false; taskFile: string; planning: boolean };

/** loadTask创建；相对路径已按任务文件所在目录解析为真实绝对路径。 */
export interface TaskConfig {
  /** 只作为复制来源的小型可信材料目录，模型不直接修改它。 */
  source: string;
  /** 本次给模型的用户任务，不含凭据。 */
  prompt: string;
  /** 既有文件的精确相对路径；工具仍负责索引和写入检查。 */
  writablePaths: string[];
  /** 副本之外的可信.mjs验收；命令固定为当前Node加tsx和此脚本。 */
  checkScript: string;
}