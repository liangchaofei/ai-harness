// 【新增文件】从操作者指定的资料中读取一条适用的历史线索。
import { readFile, stat } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

import type { TaskMemory } from '../types/task';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 读取任务配置指定的笔记，由 loadTask 在启动任务时调用。
 * @param selection 任务配置中尚未校验的 memory，包含 file 和 topic。
 * @param base 任务配置所在的目录，用来解析相对的 file。
 * @param signal 可选取消信号，传给笔记文件的读取操作。
 * @returns 匹配的一条记录。未配置或未命中时返回 undefined，资料无效或重复命中时抛错。
 */
export async function loadTaskMemory(
  selection: unknown,
  base: string,
  signal?: AbortSignal,
): Promise<TaskMemory | undefined> {
  if (selection === undefined) {
    return undefined;
  }

  if (!isRecord(selection) || typeof selection.file !== 'string' ||
      !selection.file.trim() || typeof selection.topic !== 'string' ||
      !selection.topic.trim() || selection.topic.length > 80) {
    throw new Error('任务记忆应指定 file 和 topic。');
  }

  const path = resolve(base, selection.file);
  const info = await stat(path);
  if (!info.isFile() || info.size > 8 * 1024) {
    throw new Error('任务记忆应为小型 JSON 文件。');
  }

  const raw: unknown = JSON.parse(await readFile(path, { encoding: 'utf8', signal }));
  if (!Array.isArray(raw)) {
    throw new Error('任务记忆应为记录数组。');
  }

  // 配置给出要找的主题，笔记给出线索正文，来源文件名由加载器补上。
  const topic = selection.topic.trim();
  const matches: TaskMemory[] = [];
  for (const note of raw) {
    if (!isRecord(note) || typeof note.topic !== 'string' ||
        typeof note.hint !== 'string' || !note.hint.trim() || note.hint.length > 240) {
      throw new Error('记忆记录应包含 topic 和简短的 hint。');
    }

    if (note.topic === topic) {
      matches.push({ topic, source: basename(path), hint: note.hint });
    }
  }

  // 多条同主题记录需要操作者合并，避免用文件顺序决定哪条生效。
  if (matches.length > 1) {
    throw new Error('同一主题有多条记忆，请先合并。');
  }
  return matches[0];
}
