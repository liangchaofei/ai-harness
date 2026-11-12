// 终端参数与已解析任务的应用契约。
/** 【新增】loadTaskMemory 选中的一条旧记录，由 runSession 转成本轮输入中的参考消息。 */
export interface TaskMemory {
  /** 与任务配置里的 memory.topic 精确匹配的主题，例如 route-repair。 */
  topic: string;
  /** 记录所在文件的文件名，例如 task-memory.json。用于提示来源，省略目录。 */
  source: string;
  /** 从笔记中读取的调查提示。加载时检查长度最多 240 个 UTF-16 代码单元。 */
  hint: string;
}

/** 参数解析器创建；main据此选择帮助或加载配置，不发起模型调用。 */
export type CliOptions =
  | { help: true }
  | {
      /** false 表示继续加载任务，此时才有 taskFile 和 planning。 */
      help: false;
      /** --task 指定的任务配置路径，由 loadTask 相对当前工作目录解析。 */
      taskFile: string;
      /** 是否为本次运行提供 update_plan 工具，由 --plan 启用，默认关闭。 */
      planning: boolean;
    };

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
  /** 【新增】loadTask 已选中的外部笔记。未配置或未命中时省略。 */
  memory?: TaskMemory;
}