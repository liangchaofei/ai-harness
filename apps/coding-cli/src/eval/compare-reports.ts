// 【新增文件】按用例 ID 比较两份版本 1 的评估报告。
import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
import { z } from 'zod';

const MAX_REPORT_BYTES = 256 * 1024;
const count = z.number().int().nonnegative();
const caseSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]{0,39}$/),
  taskFile: z.string().min(1),
  outcome: z.enum(['accepted', 'notAccepted', 'infrastructureFailure', 'cancelled']),
  elapsedMs: count,
  metrics: z.object({
    status: z.enum(['answered', 'callLimit', 'truncated', 'emptyAnswer', 'failed', 'cancelled', 'timedOut', 'toolLimit']),
    modelCalls: count,
    toolCalls: count,
  }).nullable(),
});
const reportSchema = z.object({
  version: z.literal(1),
  manifest: z.string().min(1),
  planned: count.min(1).max(20),
  evaluated: count,
  accepted: count,
  acceptanceRate: z.number().min(0).max(1).nullable(),
  cancelled: z.boolean(),
  results: z.array(caseSchema).max(20),
});

/** 只读已有报告。先核对结构，再核对汇总能否由逐项结果重算。 */
async function readReport(path: string, signal: AbortSignal) {
  signal.throwIfAborted();
  const file = await open(path, constants.O_RDONLY | constants.O_NONBLOCK);
  try {
    if (!(await file.stat()).isFile()) {
      throw new Error('评估报告应为普通文件。');
    }
    const chunks: Buffer[] = [];
    for await (const chunk of file.createReadStream({
      end: MAX_REPORT_BYTES,
      autoClose: false,
      signal,
    })) {
      chunks.push(chunk);
    }
    const data = Buffer.concat(chunks);
    if (data.length > MAX_REPORT_BYTES) {
      throw new Error('评估报告超过 256 KiB。');
    }

    const report = reportSchema.parse(JSON.parse(data.toString('utf8')));
    const byId = new Map(report.results.map((item) => [item.id, item]));
    const accepted = report.results.filter((item) => item.outcome === 'accepted').length;
    const incomplete = report.cancelled || report.evaluated !== report.planned ||
      report.results.some((item) => item.outcome === 'infrastructureFailure' || item.outcome === 'cancelled');
    const acceptanceRate = incomplete ? null : accepted / report.planned;
    if (byId.size !== report.results.length || report.evaluated !== report.results.length ||
        report.evaluated > report.planned || report.accepted !== accepted ||
        report.acceptanceRate !== acceptanceRate ||
        (!report.cancelled && report.results.some((item) => item.outcome === 'cancelled'))) {
      throw new Error('评估报告汇总与逐项结果不一致。');
    }
    return { report, byId };
  } finally {
    await file.close();
  }
}

/** 交付变化单独分类。运行次数只在两边都有计数时才计算差值。 */
function compareCase(baseline: z.infer<typeof caseSchema>, candidate: z.infer<typeof caseSchema>) {
  if (baseline.taskFile !== candidate.taskFile) {
    return { change: 'incomparable' as const, reason: 'taskPathMismatch' };
  }
  const comparable = (outcome: string) => outcome === 'accepted' || outcome === 'notAccepted';
  if (!comparable(baseline.outcome) || !comparable(candidate.outcome)) {
    return { change: 'incomparable' as const, reason: 'missingOutcome' };
  }
  const change = baseline.outcome === candidate.outcome
    ? 'unchanged' as const
    : candidate.outcome === 'accepted' ? 'improvement' as const : 'regression' as const;

  return {
    change,
    baselineOutcome: baseline.outcome,
    candidateOutcome: candidate.outcome,
    elapsedDeltaMs: candidate.elapsedMs - baseline.elapsedMs,
    metricsDelta: baseline.metrics && candidate.metrics ? {
      baselineStatus: baseline.metrics.status,
      candidateStatus: candidate.metrics.status,
      modelCalls: candidate.metrics.modelCalls - baseline.metrics.modelCalls,
      toolCalls: candidate.metrics.toolCalls - baseline.metrics.toolCalls,
    } : null,
  };
}

/** 比较方向固定为基线到候选；缺少整批对照条件时返回 2。 */
export async function compareEvalReports(baselinePath: string, candidatePath: string, signal: AbortSignal) {
  const [baseline, candidate] = await Promise.all([
    readReport(baselinePath, signal),
    readReport(candidatePath, signal),
  ]);
  const sameManifest = baseline.report.manifest === candidate.report.manifest;
  const ids = new Set([...baseline.byId.keys(), ...candidate.byId.keys()]);
  const cases = [...ids].map((id) => {
    const before = baseline.byId.get(id);
    const after = candidate.byId.get(id);
    if (!sameManifest) {
      return { id, change: 'incomparable' as const, reason: 'manifestPathMismatch' };
    }
    if (!before || !after) {
      return { id, change: 'incomparable' as const, reason: 'missingCase' };
    }
    return { id, ...compareCase(before, after) };
  });

  const baselineAcceptanceRate = baseline.report.acceptanceRate;
  const candidateAcceptanceRate = candidate.report.acceptanceRate;
  const comparable = sameManifest && baselineAcceptanceRate !== null &&
    candidateAcceptanceRate !== null && cases.every((item) => item.change !== 'incomparable');
  const regressions = cases.filter((item) => item.change === 'regression').length;
  const improvements = cases.filter((item) => item.change === 'improvement').length;
  const acceptanceRateDelta = comparable
    ? candidateAcceptanceRate - baselineAcceptanceRate
    : null;
  return {
    report: {
      comparable,
      baselineAcceptanceRate,
      candidateAcceptanceRate,
      acceptanceRateDelta,
      regressions,
      improvements,
      cases,
    },
    exitCode: !comparable ? 2 : regressions > 0 ? 1 : 0,
  };
}
