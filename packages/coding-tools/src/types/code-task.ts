// 【新增文件】代码任务的可信执行配置与真实验收结果。
import type { WorkspaceOptions } from './workspace';

/** 应用选定命令；不接受模型提交 executable 或 args。 */
export interface CheckCommand {
  /** 可信程序的绝对路径；当前示例使用 process.execPath。 */
  executable: string;
  /** 启动时复制的参数，不经 shell 展开。 */
  args: readonly string[];
}

/** 应用只给工作副本开放这组能力，不是 OS 隔离配置。 */
export interface CodeTaskOptions extends WorkspaceOptions {
  /** 索引中可修改的精确相对路径；可读不代表可写。 */
  writablePaths: readonly string[];
  /** 可信验收命令，脚本应在模型可写范围之外。 */
  check: CheckCommand;
}

/** 验收进程工具创建，模型与应用读取；失败用例也是正常观察结果。 */
export interface CheckResult {
  /** passed只表示进程退出0；其他值区分非零退出、单次3秒时限、8KiB输出限制。 */
  status: 'passed' | 'failed' | 'timedOut' | 'outputLimit';
  /** 直接子进程退出码；被信号停止时可为null。 */
  exitCode: number | null;
  /** stdout/stderr合计最多保留8KiB，不代表程序只产生这些输出。 */
  stdout: string;
  stderr: string;
}