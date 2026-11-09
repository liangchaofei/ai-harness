// 建立有限路径索引，并在每次读取前复查普通路径。
import { constants } from 'node:fs';
import { lstat, opendir, realpath } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { ToolExecutionError } from '@ai-harness/runtime';
import { readTextFile } from '../files/read-text';
import type { Workspace, WorkspaceOptions } from '../types/workspace';

const MAX_ENTRIES = 256;
const MAX_FILES = 64;
const MAX_DEPTH = 6;
const IGNORED = new Set(['node_modules', 'dist']);
const KNOWN_IO = new Set(['ENOENT', 'EACCES', 'EPERM', 'ENOTDIR', 'ELOOP']);

/** 限定可公开的文件系统错误；未知异常交回 Runtime 停止，不回传真实路径。 */
async function guardIo<T>(action: () => Promise<T>): Promise<T> {
  try { return await action(); }
  catch (error) {
    const code = error instanceof Error && 'code' in error ? error.code : undefined;
    if (typeof code === 'string' && KNOWN_IO.has(code)) {
      throw new ToolExecutionError(`工作区材料不可用（${code}）。`);
    }
    throw error;
  }
}

/** 应用在启动运行前调用；超过扫描范围就拒绝创建，不返回半份文件索引。 */
export async function openWorkspace(options: WorkspaceOptions, signal?: AbortSignal): Promise<Workspace> {
  if (typeof options.root !== 'string' || !isAbsolute(options.root)) throw new Error('工作区 root 必须是绝对目录路径。');
  signal?.throwIfAborted();
  const root = await guardIo(() => realpath(options.root));
  if (!(await guardIo(() => lstat(root))).isDirectory()) throw new Error('工作区 root 必须是目录。');
  // 【新增】复制应用范围；旧调用省略时仍只扫描 .ts。
  const extensions = Object.freeze([...(options.extensions ?? ['.ts'])]);
  if (extensions.length === 0 || extensions.some((item) => typeof item !== 'string' || !/^\.[a-z0-9]{1,12}$/.test(item))) {
    throw new Error('extensions 必须是非空清单，每项为点加1..12位小写字母或数字。');
  }
  const files = new Map<string, string>();
  let entriesSeen = 0;

  async function visit(parts: string[]): Promise<void> {
    signal?.throwIfAborted();
    const directory = await guardIo(() => opendir(join(root, ...parts)));
    const names: string[] = [];
    // for await 正常结束、提前退出或抛错时都会关闭目录句柄。
    for await (const entry of directory) {
      signal?.throwIfAborted();
      entriesSeen += 1;
      if (entriesSeen > MAX_ENTRIES) throw new Error('工作区超过 256 个目录项，请缩小材料范围。');
      names.push(entry.name);
    }
    for (const name of names.sort()) {
      signal?.throwIfAborted();
      if (name.startsWith('.') || IGNORED.has(name)) continue;
      const next = [...parts, name];
      const target = join(root, ...next);
      const info = await guardIo(() => lstat(target));
      if (info.isSymbolicLink()) continue;
      if (info.isDirectory()) {
        if (next.length > MAX_DEPTH) throw new Error('工作区超过 6 层目录，请缩小材料范围。');
        await visit(next);
      // 【修改】仅接收应用选择的文本后缀。
      } else if (info.isFile() && extensions.some((extension) => name.endsWith(extension))) {
        const relativePath = next.join('/');
        if (relativePath.length > 240) throw new Error('工作区相对路径超过 240 字符，请缩短材料路径。');
        files.set(relativePath, target);
        if (files.size > MAX_FILES) throw new Error('工作区超过 64 个允许的文本文件，请缩小材料范围。');
      }
    }
  }
  await visit([]);
  const paths = Object.freeze([...files.keys()].sort());
  // 【修改】原 read 内路径门禁提为 resolve，供读取和替换共同复查。
  async function resolve(path: string, signal?: AbortSignal): Promise<string> {
    signal?.throwIfAborted();
    const target = files.get(path);
    if (!target) throw new ToolExecutionError('该路径不在本次工作区索引中，请先查找实际路径。');
    // 索引不是执行授权的永久证明；文件或祖先目录可能已被替换。
    const parts = path.split('/');
    await guardIo(async () => {
      for (let i = 0; i < parts.length; i += 1) {
        signal?.throwIfAborted();
        const info = await lstat(join(root, ...parts.slice(0, i + 1)));
        if (info.isSymbolicLink() || (i < parts.length - 1 ? !info.isDirectory() : !info.isFile())) {
          throw new ToolExecutionError('工作区路径已变化，只允许普通目录和文件。');
        }
      }
      if (await realpath(target) !== target) throw new ToolExecutionError('工作区路径已变化，请重新准备材料。');
    });
    return target;
  }
  return {
    root, extensions, paths, resolve,
    async read(path, readSignal) {
      const target = await resolve(path, readSignal);
      // O_NOFOLLOW 限制最终文件链接；祖先替换竞争仍非 OS 沙箱。
      return readTextFile(target, readSignal, constants.O_RDONLY | constants.O_NOFOLLOW);
    },
  };
}
