// 【新增文件】由 CLI 保存已返回的运行结果。
import { constants } from 'node:fs';
import { appendFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RunResult } from '@ai-harness/runtime';

/** 写入首行并返回绝对路径。已有文件由 wx 拒绝覆盖。 */
export async function createSessionLog(file: string, workspace: string): Promise<string> {
  const path = resolve(file);
  const header = { type: 'session', version: 1, workspace };
  await writeFile(path, JSON.stringify(header) + '\n', { flag: 'wx', mode: 0o600 });
  return path;
}

/**
 * 写入一段已结束的运行。
 * @param start 已记录的历史条数。首段为 0，追问段从首段历史末尾开始。
 */
export async function appendRun(path: string, result: RunResult, start: number): Promise<void> {
  const entry = {
    type: 'run',
    runId: result.runId,
    status: result.status,
    modelCalls: result.modelCalls,
    toolCalls: result.toolCalls,
    messages: result.messages.slice(start),
  };
  await appendFile(path, JSON.stringify(entry) + '\n', { flag: constants.O_WRONLY | constants.O_APPEND });
}