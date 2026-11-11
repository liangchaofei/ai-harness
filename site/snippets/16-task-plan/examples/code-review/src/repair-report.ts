// 从实际会话取证，展示内容差异，再按应用规则接受。
import type { RunResult } from '@ai-harness/runtime';
import type { RepairSession } from './types/repair-session';
// 【新增】最后展示计划快照，接受条件仍只读实际代码与验收。
import { printPlan } from './planning/print-plan';
import { acceptRepair } from './repair-acceptance';
import { printRun } from '../../shared/print-run';
import { logBlock } from '../../shared/terminal';

/** 文本JSON展开方便观察；不是业务通过判断。 */
function decodeOutput(text: string): unknown {
  try { return JSON.parse(text); } catch { return text; }
}

/** runRepair等待停止后调用；取证失败抛回入口，不能当作接受成功。 */
export async function reportRepair(session: RepairSession, result: RunResult): Promise<boolean> {
  printRun(result);
  if (session.plan) printPlan(session.plan.read());
  // 不从result.messages提取通过记录；重新采集文件，读取私有会话的真实检查结果。
  const review = await session.codeTask.inspect();
  for (const change of review.changes) {
    logBlock(`修改前 · ${change.path}`, change.before);
    logBlock(`当前内容 · ${change.path}`, change.after);
  }
  const check = review.lastCheck;
  if (check) {
    logBlock('最近实际验收', { revision: check.revision, stable: check.stable,
      status: check.status, exitCode: check.exitCode });
    logBlock('验收 stdout', decodeOutput(check.stdout));
    if (check.stderr) logBlock('验收 stderr', check.stderr);
  }
  const accepted = acceptRepair(result, review);
  logBlock('交付判断', { status: result.status, changedFiles: review.changes.map((change) => change.path),
    currentRevision: review.currentRevision, checkedRevision: check?.revision ?? 'notRun',
    checkMatchesCurrent: review.checkMatchesCurrent, accepted });
  console.log(accepted ? '当前范围内的修改与验收匹配，已形成可审阅交付；副本未合入原项目。'
    : '未接受：需要正常回答、实际变化、匹配当前内容的通过验收及业务输出。');
  return accepted;
}
