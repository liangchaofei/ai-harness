// 【新增文件】按清单串行运行真实任务，汇总交付、轨迹证据与耗时。
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { z } from 'zod';
import { inspectRunTrace } from '../report/inspect-trace';

const manifestSchema = z.object({
  version: z.literal(1),
  cases: z.array(z.object({
    id: z.string().regex(/^[a-z][a-z0-9-]{0,39}$/),
    taskFile: z.string().min(1),
  })).min(1).max(20),
});

const outcomes = {
  0: 'accepted',
  1: 'notAccepted',
  2: 'infrastructureFailure',
  130: 'cancelled',
} as const;

/** 仅从单段、有结束证据且无半行的轨迹取计数，失败时保留缺失状态。 */
async function readMetrics(path: string) {
  try {
    const { runs, partialTail } = await inspectRunTrace(path);
    const run = runs[0];
    if (runs.length === 1 && !partialTail && run?.evidence === 'ended') {
      return { status: run.status, modelCalls: run.modelCalls, toolCalls: run.toolCalls };
    }
  } catch {
    // 准备阶段可能没有创建轨迹。诊断不可用不覆盖原退出结果。
  }
  return undefined;
}

/** 同一批次每项调用一次完整 CLI 生命周期，由调用方决定使用哪个模型。 */
export async function runEvalSuite(
  manifestFile: string,
  outputDirectory: string,
  runTask: (args: readonly string[]) => Promise<number>,
  signal: AbortSignal,
) {
  const manifestPath = resolve(manifestFile);
  const manifest = manifestSchema.parse(JSON.parse(await readFile(manifestPath, {
    encoding: 'utf8',
    signal,
  })));
  if (new Set(manifest.cases.map(({ id }) => id)).size !== manifest.cases.length) {
    throw new Error('任务集用例 ID 必须唯一。');
  }

  signal.throwIfAborted();
  const output = resolve(outputDirectory);
  await mkdir(output, { mode: 0o700 });

  const results = [];
  for (const item of manifest.cases) {
    if (signal.aborted) {
      break;
    }

    const taskFile = resolve(dirname(manifestPath), item.taskFile);
    const traceFile = item.id + '.jsonl';
    const tracePath = join(output, traceFile);
    const startedAt = performance.now();
    const code = await runTask(['--task', taskFile, '--trace-file', tracePath]);
    const elapsedMs = Math.round(performance.now() - startedAt);
    const metrics = await readMetrics(tracePath);
    const outcome = outcomes[code as keyof typeof outcomes] ?? 'infrastructureFailure';
    results.push({ id: item.id, taskFile, outcome, elapsedMs, traceFile, metrics: metrics ?? null });

    if (outcome === 'cancelled') {
      break;
    }
  }

  const accepted = results.filter((item) => item.outcome === 'accepted').length;
  const cancelled = signal.aborted || results.some((item) => item.outcome === 'cancelled');
  const complete = !cancelled && results.length === manifest.cases.length &&
    results.every((item) => item.outcome !== 'infrastructureFailure');
  const report = {
    version: 1,
    manifest: manifestPath,
    planned: manifest.cases.length,
    evaluated: results.length,
    accepted,
    acceptanceRate: complete ? accepted / manifest.cases.length : null,
    cancelled,
    results,
  };
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', {
    flag: 'wx',
    mode: 0o600,
  });

  const exitCode = cancelled ? 130
    : results.some((item) => item.outcome === 'infrastructureFailure') ? 2
    : accepted === report.planned ? 0 : 1;
  return { report, exitCode };
}
