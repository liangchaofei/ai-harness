// 【新增文件】展示实际副本变化和某次验收记录；不自动合回原材料。
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CheckResult } from '@ai-harness/coding-tools';
import type { RunResult } from '@ai-harness/runtime';
import type { RepairSession } from './types/repair-session';
import { printRun } from '../../shared/print-run';
import { logBlock } from '../../shared/terminal';

/** stdout若是JSON就按对象展示；非JSON或被截断时保留原文。 */
function decodeOutput(text: string): unknown {
  try { return JSON.parse(text); } catch { return text; }
}

/** 返回是否形成可供审阅的候选；并不证明旧验收匹配最终源码版本。 */
export async function reportRepair(session: RepairSession, result: RunResult): Promise<boolean> {
  printRun(result);
  const after = await readFile(join(session.root, 'src/checkout/invoice.ts'), 'utf8');
  const checks: CheckResult[] = [];
  for (const message of result.messages) {
    if (message.role !== 'toolResult' || message.toolName !== 'run_check' || message.isError) continue;
    // 此JSON由本应用配置的可信工具产生，不是模型自然语言。
    const observation: CheckResult = JSON.parse(message.content);
    checks.push(observation);
    logBlock(`验收记录 · ${message.toolCallId}`, { status: observation.status, exitCode: observation.exitCode });
    logBlock('验收 stdout', decodeOutput(observation.stdout));
    if (observation.stderr) logBlock('验收 stderr', observation.stderr);
  }
  const check = checks.at(-1);
  const detail = decodeOutput(check?.stdout ?? '');
  const passedOutput = typeof detail === 'object' && detail !== null && 'passed' in detail && detail.passed === true;
  logBlock('修改前', session.before);
  logBlock('副本当前内容', after);
  const readyForReview = result.status === 'answered' && after !== session.before && check?.status === 'passed' && passedOutput;
  logBlock('修复观察', { status: result.status, changed: after !== session.before,
    lastCheckStatus: check?.status ?? 'notRun', readyForReview });
  console.log('这是待审阅候选；历史验收记录未绑定当前内容，不能自动交付。');
  return readyForReview;
}