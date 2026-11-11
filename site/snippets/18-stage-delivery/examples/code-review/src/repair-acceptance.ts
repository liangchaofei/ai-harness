// 应用的接受规则；Runtime的answered不是任务验收。
import type { CodeTaskReview } from '@ai-harness/coding-tools';
import type { RunResult } from '@ai-harness/runtime';

/** report调用；只解析可信验收程序的配套JSON，不解析模型总结。 */
export function acceptRepair(result: RunResult, review: CodeTaskReview): boolean {
  const check = review.lastCheck;
  if (
    result.status !== 'answered' ||
    review.changes.length === 0 ||
    review.changes.some((change) => change.path !== 'src/checkout/invoice.ts') ||
    !review.checkMatchesCurrent ||
    check?.status !== 'passed' ||
    check.exitCode !== 0
  ) {
    return false;
  }
  let detail: unknown;
  try {
    detail = JSON.parse(check.stdout);
  } catch {
    return false;
  }
  return (
    typeof detail === 'object' &&
    detail !== null &&
    'passed' in detail &&
    detail.passed === true
  );
}
