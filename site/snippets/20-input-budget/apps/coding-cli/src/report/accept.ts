// CLI的任务接受规则，独立于模型回答与计划状态。
import type { CodeTaskReview } from '@ai-harness/coding-tools';
import type { RunResult } from '@ai-harness/runtime';

/** 当前CLI约定可信验收stdout为JSON且passed:true；并非所有程序通用的成功协议。 */
export function acceptTask(
  result: RunResult,
  review: CodeTaskReview,
  writablePaths: readonly string[],
): boolean {
  const check = review.lastCheck;
  if (
    result.status !== 'answered' ||
    review.changes.length === 0 ||
    review.changes.some((change) => !writablePaths.includes(change.path)) ||
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
