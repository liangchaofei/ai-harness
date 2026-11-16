//保存并接续一个明确等待验收的工作副本。
import { createHash } from 'node:crypto';
import { readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import type { RunResult } from '@ai-harness/runtime';
import type { CliSession } from '../types/session';
import type { CheckDecision, TaskConfig } from '../types/task';
import { readCheckApproval, saveCheckApproval } from './check-approval';
import { claimCheck, inspectCheckReceipt, saveCheckReceipt } from './check-receipt';
import { openTaskWorkspace } from './prepare';

/** 写入方创建，恢复方校验。记录一次待执行的验收及其适用内容。 */
interface PendingCheck {
  /** 检查点的磁盘格式版本。 */
  version: 1;
  /** 下一步固定为验收，恢复入口据此选择动作。 */
  next: 'check';
  /** 创建时确认的旧副本绝对路径。 */
  workspace: string;
  /** 写入检查点时，副本受跟踪文本范围的内容指纹。 */
  revision: string;
  /** 任务来源、可写路径、验收脚本位置和脚本正文的指纹。 */
  taskKey: string;
  /** 【新增】写入 true 才需要人工决定。旧检查点没有该字段。 */
  requiresApproval?: true;
}

function isPendingCheck(value: unknown): value is PendingCheck {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return item.version === 1 && item.next === 'check' &&
    typeof item.workspace === 'string' && isAbsolute(item.workspace) &&
    typeof item.revision === 'string' && /^[a-f0-9]{64}$/.test(item.revision) &&
    typeof item.taskKey === 'string' && /^[a-f0-9]{64}$/.test(item.taskKey) &&
    (item.requiresApproval === undefined || item.requiresApproval === true);
}

async function taskKey(task: TaskConfig, signal?: AbortSignal): Promise<string> {
  const script = await readFile(task.checkScript, { encoding: 'utf8', signal });
  return createHash('sha256').update(JSON.stringify([
    task.source,
    task.writablePaths,
    task.checkScript,
    script,
  ])).digest('hex');
}

/** 只在正常返回、已有允许改动且未请求验收时写下待验收检查点。 */
export async function savePendingCheck(
  path: string,
  task: TaskConfig,
  session: CliSession,
  result: RunResult,
  signal?: AbortSignal,
  requiresApproval = false,
): Promise<void> {
  const requestedCheck = result.messages.some((message) =>
    message.role === 'assistant' && message.toolCalls.some((call) => call.name === 'run_check'),
  );
  const review = await session.codeTask.inspect(signal);
  if (result.status !== 'answered' || requestedCheck || review.lastCheck ||
      review.changes.length === 0 ||
      review.changes.some((change) => !task.writablePaths.includes(change.path))) {
    throw new Error('只能保存已修改且尚未尝试验收的受控交接。');
  }

  const entry: PendingCheck = {
    version: 1,
    next: 'check',
    workspace: await realpath(session.root),
    revision: review.currentRevision,
    taskKey: await taskKey(task, signal),
    ...(requiresApproval ? { requiresApproval: true } : {}),
  };
  signal?.throwIfAborted();
  await writeFile(path, JSON.stringify(entry) + '\n', { flag: 'wx', mode: 0o600 });
}

async function openPendingCheck(path: string, task: TaskConfig, signal?: AbortSignal) {
  const checkpointPath = await realpath(resolve(path));
  const info = await stat(checkpointPath);
  if (!info.isFile() || info.size > 8 * 1024) {
    throw new Error('检查点文件无效或超限。');
  }
  const text = await readFile(checkpointPath, { encoding: 'utf8', signal });
  const entry: unknown = JSON.parse(text);
  if (Buffer.byteLength(text) > 8 * 1024 || !isPendingCheck(entry) ||
      entry.taskKey !== await taskKey(task, signal) ||
      await realpath(entry.workspace) !== entry.workspace) {
    throw new Error('检查点与当前任务不匹配。');
  }

  const session = await openTaskWorkspace(task, entry.workspace, signal);
  const before = await session.inspect(signal);
  if (before.currentRevision !== entry.revision) {
    throw new Error('副本内容与检查点不一致。');
  }
  const checkpointKey = createHash('sha256').update(text).digest('hex');
  return { checkpointPath, checkpointKey, entry, session };
}

/** 【新增】先核对任务和副本，再写入操作者对这一个待验收动作的决定。 */
export async function decidePendingCheck(
  path: string,
  task: TaskConfig,
  decision: CheckDecision,
  signal?: AbortSignal,
) {
  const { checkpointPath, checkpointKey, entry } = await openPendingCheck(path, task, signal);
  if (!entry.requiresApproval || (await inspectCheckReceipt(checkpointPath, checkpointKey)).status !== 'pending') {
    throw new Error('当前检查点没有可批准的待验收动作。');
  }
  await saveCheckApproval(checkpointPath, checkpointKey, decision, signal);
  return { workspace: entry.workspace, approval: decision === 'approve' ? 'approved' : 'denied' };
}

/** 操作者查看检查点的批准与执行证据。 */
export async function inspectPendingCheck(path: string, task: TaskConfig, signal?: AbortSignal) {
  const { checkpointPath, checkpointKey, entry } = await openPendingCheck(path, task, signal);
  const state = await inspectCheckReceipt(checkpointPath, checkpointKey);
  const approval = entry.requiresApproval
    ? await readCheckApproval(checkpointPath, checkpointKey, signal)
    : 'notRequired';
  return {
    workspace: entry.workspace,
    approval,
    status: state.status,
    ...(state.status === 'completed' ? { historicalPassed: state.receipt.passed } : {}),
  };
}

/** 先确认副本和任务，再占用检查点并执行一次原有验收。 */
export async function resumePendingCheck(path: string, task: TaskConfig, signal?: AbortSignal) {
  const { checkpointPath, checkpointKey, entry, session } = await openPendingCheck(path, task, signal);
  // 【新增】等待或拒绝时，在创建 .started 前退出。
  if (entry.requiresApproval) {
    const approval = await readCheckApproval(checkpointPath, checkpointKey, signal);
    if (approval !== 'approved') {
      return { workspace: entry.workspace, approval };
    }
  }
  const check = session.tools.find((tool) => tool.name === 'run_check');
  if (!check) throw new Error('当前任务缺少验收工具。');

  // 已有匹配回执时复用结果；已占用且无回执时由 claimCheck 拒绝继续。
  signal?.throwIfAborted();
  const receipt = await claimCheck(checkpointPath, checkpointKey);
  if (receipt) {
    return { workspace: entry.workspace, passed: receipt.passed, feedback: receipt.feedback, reused: true };
  }
  const feedback = await check.execute({}, signal);
  const after = await session.inspect(signal);
  const report: unknown = JSON.parse(after.lastCheck?.stdout ?? 'null');
  const passed = after.checkMatchesCurrent && after.currentRevision === entry.revision &&
    after.lastCheck?.status === 'passed' && after.lastCheck.exitCode === 0 &&
    typeof report === 'object' && report !== null && 'passed' in report && report.passed === true;
  // 先写回执，再向调用方返回结果。
  await saveCheckReceipt(checkpointPath, { checkpointKey, passed, feedback });
  return { workspace: entry.workspace, passed, feedback, reused: false };
}
