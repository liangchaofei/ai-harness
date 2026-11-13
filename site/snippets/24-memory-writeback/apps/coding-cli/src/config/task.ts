// 把操作者的可信任务配置转换为准备副本所需数据。
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { loadTaskMemory } from '../context/task-memory';
import type { MemoryCapture, TaskConfig } from '../types/task';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** CLI路径按cwd解析；配置内source/checkScript按配置文件目录解析。 */
export async function loadTask(taskFile: string, signal?: AbortSignal): Promise<TaskConfig> {
  signal?.throwIfAborted();
  const configPath = await realpath(resolve(taskFile));
  const info = await stat(configPath);
  if (!info.isFile() || info.size > 16 * 1024) throw new Error('任务配置应为小型JSON文件。');
  const value: unknown = JSON.parse(await readFile(configPath, { encoding: 'utf8', signal }));
  const keys = ['source', 'prompt', 'writablePaths', 'checkScript'];
  // 保留四个必填字段，只额外允许可选的 memory。
  if (
    !isRecord(value) ||
    keys.some((key) => !Object.hasOwn(value, key)) ||
    Object.keys(value).some((key) => !keys.includes(key) && key !== 'memory')
  ) {
    throw new Error('任务字段不匹配。');
  }
  const { source, prompt, writablePaths, checkScript } = value;
  if (typeof source !== 'string' || !source.trim() || typeof checkScript !== 'string' || !checkScript.trim()
    || typeof prompt !== 'string' || !prompt.trim() || prompt.length > 4000
    || !Array.isArray(writablePaths) || writablePaths.length < 1 || writablePaths.length > 16
    || writablePaths.some((path) => typeof path !== 'string' || !path.trim())
    || new Set(writablePaths).size !== writablePaths.length) throw new Error('任务字段无效。');

  const base = dirname(configPath);
  const sourcePath = await realpath(resolve(base, source));
  const scriptPath = await realpath(resolve(base, checkScript));
  if (!(await stat(sourcePath)).isDirectory() || !(await stat(scriptPath)).isFile()
    || !scriptPath.endsWith('.mjs')) throw new Error('材料或验收文件无效。');
  const scriptRelative = relative(sourcePath, scriptPath);
  // 验收在来源之外，避免把它复制到模型处理的材料中；这不是OS隔离。
  if (scriptRelative === '' || (!isAbsolute(scriptRelative)
    && scriptRelative !== '..' && !scriptRelative.startsWith('../'))) throw new Error('验收应在材料目录之外。');
  // 只在加载任务时读取；模型调用期间复用选中的一条记录。
  const memory = await loadTaskMemory(value.memory, base, signal);
  // 【新增】读取笔记和授权写入是两项独立的配置决定。
  let memoryCapture: MemoryCapture | undefined;
  if (isRecord(value.memory) && Object.hasOwn(value.memory, 'captureCase')) {
    const { file, topic, captureCase } = value.memory;
    if (
      typeof file !== 'string' ||
      typeof topic !== 'string' ||
      typeof captureCase !== 'string' ||
      captureCase.length === 0 ||
      captureCase.length > 64
    ) {
      throw new Error('记忆写入需要指定可核对的验收用例。');
    }
    memoryCapture = {
      path: await realpath(resolve(base, file)),
      topic: topic.trim(),
      caseInput: captureCase,
    };
  }

  signal?.throwIfAborted();
  return {
    source: sourcePath,
    prompt: prompt.trim(),
    writablePaths: [...writablePaths],
    checkScript: scriptPath,
    ...(memory ? { memory } : {}),
    ...(memoryCapture ? { memoryCapture } : {}),
  };

}
