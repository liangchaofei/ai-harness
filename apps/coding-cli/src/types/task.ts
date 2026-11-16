// 终端参数与已解析任务的应用契约。
import type { Message } from '@ai-harness/model';

/** loadTaskMemory 选中的一条旧记录，由 runSession 转成本轮输入中的参考消息。 */
export interface TaskMemory {
  /** 与任务配置里的 memory.topic 精确匹配的主题，例如 route-repair。 */
  topic: string;
  /** 记录所在文件的文件名，例如 task-memory.json。用于提示来源，省略目录。 */
  source: string;
  /** 从笔记中读取的调查提示。加载时检查长度最多 240 个 UTF-16 代码单元。 */
  hint: string;
}

/** 操作者通过 --decide-check 保存的一次批准或拒绝。 */
export type CheckDecision = 'approve' | 'deny';

/** 参数解析器创建；main据此选择帮助或加载配置，不发起模型调用。 */
export type CliOptions =
  | { help: true }
  | {
      help: false;
      /** 只读接续模式使用的会话日志路径。 */
      resumeLog: string;
      /** 追加到旧历史末尾的新问题。 */
      question: string;
    }
  | {
      /** false 表示继续加载任务，此时才有 taskFile 和 planning。 */
      help: false;
      /** --task 指定的任务配置路径，由 loadTask 相对当前工作目录解析。 */
      taskFile: string;
      /** 操作者指定的新会话记录文件，省略时只保留终端报告。 */
      sessionLog?: string;
      /** 受控交接时写入的新检查点路径。 */
      checkpoint?: string;
      /** 创建检查点时将验收留给单独批准后的恢复进程。 */
      gateCheck?: boolean;
      /** 仅记录对指定检查点的决定。 */
      decideCheck?: { path: string; decision: CheckDecision };
      /** 从此检查点对旧副本执行一次验收。 */
      resumeCheck?: string;
      /** 检查指定检查点的证据，不执行验收。 */
      inspectCheck?: string;
      /** 是否为本次运行提供 update_plan 工具，由 --plan 启用，默认关闭。 */
      planning: boolean;
      /** 操作者明确限制本次任务只能执行调查工具。 */
      readOnly?: boolean;
      /** 操作者要求逐次批准修改与验收。 */
      approveTools?: boolean;
      /** 第一段正常回答后提交的一条追问，省略时只运行一段。 */
      followUp?: string;
    };

/** 磁盘上的一条笔记。写入时保留已有的附加字段。 */
export interface MemoryNote {
  /** 同一文件内用于查找与更新的键。 */
  topic: string;
  /** 选中后提供给模型的调查线索。 */
  hint: string;
  /** 操作者设为 false 后停止检索和自动更新。 */
  enabled?: unknown;
  /** 保留来源等附加字段，由各自的写入方解释。 */
  [key: string]: unknown;
}

/** 操作者为本任务授权的写入范围，由 loadTask 解析后交给报告层。 */
export interface MemoryCapture {
  /** 已存在的笔记文件的绝对路径。 */
  path: string;
  /** 文件内唯一的主题，同时作为更新时的键。 */
  topic: string;
  /** 从最终验收中提取的用例输入，例如根路径 /。 */
  caseInput: string;
}

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
  /** 【新增】操作者选择的内置扩展。省略时仅使用原工具。 */
  extension?: 'source-pair';
  /** loadTask 已选中的外部笔记。未配置或未命中时省略。 */
  memory?: TaskMemory;
  /** 有此配置才在交付后尝试保存验收线索。 */
  memoryCapture?: MemoryCapture;
}

/** 应用给单段运行的输入选项。正常 CLI 使用默认输入策略。 */
export interface RunInputOptions {
  /** 第二段的完整起点，含上一段历史和本次追问。省略时从原任务开始。 */
  messages?: readonly Message[];
  /** 观察入口用的全量对照。为 true 时保留全量历史，跳过裁剪和验收摘要。 */
  fullHistory?: boolean;
  /** 每段运行沿用同一个只读限制。 */
  readOnly?: boolean;
  /** 本段在修改与验收前等待一次终端批准。 */
  approveTools?: boolean;
  /** 本段只准备改动，run_check 留给检查点恢复入口。 */
  deferCheck?: boolean;
}
