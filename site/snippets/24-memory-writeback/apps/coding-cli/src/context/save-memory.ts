// 【新增文件】从匹配当前副本的验收中提取一条线索，并按主题更新笔记。
import { mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import type { CodeTaskReview } from '@ai-harness/coding-tools';
import type { MemoryCapture, MemoryNote } from '../types/task';
import { readMemoryNotes } from './task-memory';

/** 报告层读取此状态。unchanged 表示笔记内容和证据来源都相同。 */
export type MemorySaveStatus = 'no-evidence' | 'disabled' | 'unchanged' | 'saved';

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 报告确认交付后调用。验收输出提供用例，模型的最终回答不参与写入。 */
export async function saveAcceptedMemory(
  capture: MemoryCapture,
  review: CodeTaskReview,
  checkScript: string,
): Promise<MemorySaveStatus> {
  const check = review.lastCheck;
  if (!review.checkMatchesCurrent || check?.status !== 'passed' || check.exitCode !== 0) {
    return 'no-evidence';
  }

  const report: unknown = JSON.parse(check.stdout);
  if (!object(report) || report.passed !== true || !Array.isArray(report.cases)) {
    return 'no-evidence';
  }

  const sample = report.cases.find((item: unknown) =>
    object(item) && item.input === capture.caseInput && item.passed === true,
  );
  if (!object(sample) || typeof sample.expected !== 'string' || sample.expected.length > 64 ||
      sample.actual !== sample.expected) {
    return 'no-evidence';
  }

  const hint = `历史验收用例：${JSON.stringify(capture.caseInput)} 的预期结果是 ${JSON.stringify(sample.expected)}。请以当前规则和验收为准。`;
  if (hint.length > 240) {
    return 'no-evidence';
  }

  const notes = await readMemoryNotes(capture.path);
  const existing = notes.filter((note) => note.topic === capture.topic);
  if (existing.length > 1) {
    throw new Error('同一主题有多条记忆，请先合并。');
  }

  const previous = existing[0];
  if (previous?.enabled === false) {
    return 'disabled';
  }

  const evidence = { checkScript: basename(checkScript), revision: check.revision };
  if (previous?.hint === hint && object(previous.evidence) &&
      previous.evidence.checkScript === evidence.checkScript &&
      previous.evidence.revision === evidence.revision) {
    return 'unchanged';
  }

  const next: MemoryNote = { ...previous, topic: capture.topic, hint, evidence };
  const updated = previous
    ? notes.map((note) => note === previous ? next : note)
    : [...notes, next];
  const text = JSON.stringify(updated, null, 2) + '\n';
  if (Buffer.byteLength(text, 'utf8') > 8 * 1024) {
    throw new Error('写入后超过笔记文件大小上限。');
  }

  // 同目录暂存完整内容，写成功后再替换原文件。
  const staging = await mkdtemp(join(dirname(capture.path), '.memory-'));
  try {
    const pending = join(staging, 'notes.json');
    await writeFile(pending, text, { mode: 0o600 });
    await rename(pending, capture.path);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }

  return 'saved';
}
