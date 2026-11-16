// 离线读取第 37 篇的 JSONL，按每次运行输出有证据的诊断。
import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
import { z } from 'zod';

const MAX_TRACE_BYTES = 256 * 1024;
const count = z.number().int().nonnegative();
const status = z.enum(['answered', 'callLimit', 'truncated', 'emptyAnswer', 'failed', 'cancelled', 'timedOut', 'toolLimit']);
// 可选扩展字段。历史轨迹缺省它，表示子运行计数未知。
const childSummary = z.object({
  childRunId: z.string().min(1),
  status,
  modelCalls: count.max(3),
  toolCalls: count.max(2),
});
const envelope = z.object({
  version: z.literal(1),
  runId: z.string().min(1),
  sequence: count.min(1),
});
const row = z.union([
  envelope.extend({ type: z.literal('run_start') }),
  envelope.extend({
    type: z.literal('model_end'),
    modelCall: count.min(1),
    stopReason: z.enum(['stop', 'length', 'toolUse']),
    toolCallCount: count,
  }),
  envelope.extend({
    type: z.literal('tool_start'),
    modelCall: count.min(1),
    toolCallId: z.string(),
    toolName: z.string(),
  }),
  envelope.extend({
    type: z.literal('run_end'),
    status,
    modelCalls: count,
    toolCalls: count,
    // 【修改】同一父段允许一批最多三个子运行。
    childRuns: z.array(childSummary).max(3).optional(),
  }),
  // 这些事件参与运行顺序检查，但不用于本篇的停止归因。
  envelope.extend({
    type: z.enum(['input_prepared', 'model_start', 'model_cancelled', 'model_failed',
      'tool_end', 'tool_cancelled', 'tool_failed']),
  }),
]);

/** 读取有上限的文件快照，只把换行结尾的数据纳入诊断。 */
export async function inspectRunTrace(path: string, signal?: AbortSignal) {
  signal?.throwIfAborted();
  // 不因误选 FIFO 而等待写入端。随后核对已打开的对象是普通文件。
  const file = await open(path, constants.O_RDONLY | constants.O_NONBLOCK);
  try {
    if (!(await file.stat()).isFile()) {
      throw new Error('轨迹应为普通文件。');
    }
    const buffer = Buffer.alloc(MAX_TRACE_BYTES + 1);
    let length = 0;
    while (length < buffer.length) {
      signal?.throwIfAborted();
      const { bytesRead } = await file.read(buffer, length, buffer.length - length, length);
      if (bytesRead === 0) {
        break;
      }
      length += bytesRead;
    }
    if (length > MAX_TRACE_BYTES) {
      throw new Error('轨迹超过 256 KiB。');
    }

    const lines = buffer.subarray(0, length).toString('utf8').split('\n');
    const partialTail = lines.pop() !== '';
    const runs = new Map<string, Array<z.infer<typeof row>>>();
    let activeRun: string | undefined;
    for (const [index, line] of lines.entries()) {
      signal?.throwIfAborted();
      const event = parseLine(line, index + 1);
      const rows = runs.get(event.runId);
      if (!rows) {
        if (event.type !== 'run_start' || event.sequence !== 1) {
          throw new Error(`第 ${index + 1} 行缺少运行起点。`);
        }
        runs.set(event.runId, [event]);
        activeRun = event.runId;
        continue;
      }

      const previous = rows.at(-1)!;
      if (event.runId !== activeRun || event.type === 'run_start' ||
          previous.type === 'run_end' || event.sequence <= previous.sequence) {
        throw new Error(`第 ${index + 1} 行不符合运行顺序。`);
      }
      rows.push(event);
    }

    return { partialTail, runs: [...runs.values()].map(summarizeRun) };
  } finally {
    await file.close();
  }
}

/** 坏行保留行号，不把原始内容带入诊断错误。 */
function parseLine(line: string, lineNumber: number) {
  try {
    return row.parse(JSON.parse(line));
  } catch {
    throw new Error(`第 ${lineNumber} 行不是支持的版本 1 轨迹记录。`);
  }
}

/** 只有结束事件及计数互相吻合时，才给出工具额度归因。 */
function summarizeRun(events: Array<z.infer<typeof row>>) {
  const end = events.at(-1)!;
  const starts = events.filter((event) => event.type === 'tool_start');
  const lastResponse = events.filter((event) => event.type === 'model_end').at(-1);
  const base = {
    runId: end.runId,
    observedToolStarts: starts.length,
  };
  if (end.type !== 'run_end') {
    return { ...base, evidence: 'prefix' as const };
  }
  if (end.toolCalls !== starts.length) {
    return { ...base, evidence: 'inconsistent' as const, status: end.status, toolCalls: end.toolCalls };
  }

  // 子运行必须与父运行身份不同，且父段有委派请求的处理证据。
  // 【修改】同一批的子 ID 必须唯一，并与父 ID 不同。
  const childIds = end.childRuns?.map((child) => child.childRunId) ?? [];
  if (childIds.includes(end.runId) || new Set(childIds).size !== childIds.length ||
      (childIds.length > 0 && !starts.some((event) => event.toolName === 'delegate_entry_review'))) {
    return { ...base, evidence: 'inconsistent' as const, status: end.status, toolCalls: end.toolCalls };
  }

  const startsInLastResponse = starts.filter((event) => event.modelCall === end.modelCalls).length;
  const lastBatch = lastResponse?.modelCall === end.modelCalls && lastResponse.stopReason === 'toolUse'
    ? { requested: lastResponse.toolCallCount, started: startsInLastResponse }
    : undefined;
  if (end.status === 'toolLimit' && (!lastBatch || lastBatch.requested <= lastBatch.started)) {
    return { ...base, evidence: 'inconsistent' as const, status: end.status, toolCalls: end.toolCalls };
  }
  const skippedByToolLimit = end.status === 'toolLimit' && lastBatch
    ? lastBatch.requested - lastBatch.started
    : undefined;

  return {
    ...base,
    evidence: 'ended' as const,
    status: end.status,
    modelCalls: end.modelCalls,
    toolCalls: end.toolCalls,
    ...(end.childRuns === undefined ? {} : {
      childRuns: end.childRuns,
      totalModelCalls: end.modelCalls + end.childRuns.reduce((sum, child) => sum + child.modelCalls, 0),
      totalToolCalls: end.toolCalls + end.childRuns.reduce((sum, child) => sum + child.toolCalls, 0),
    }),
    ...(lastBatch ? { lastBatch } : {}),
    ...(skippedByToolLimit !== undefined ? { skippedByToolLimit } : {}),
  };
}
