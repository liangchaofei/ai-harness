// 【新增文件】宿主共用的代码交付判断，保持与 CLI 原规则一致。
import type { CodeTaskReview } from '@ai-harness/coding-tools';
import type { RunResult } from '@ai-harness/runtime';

/** 按可信验收约定判断交付，stdout 必须是包含 passed: true 的 JSON。 */
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
