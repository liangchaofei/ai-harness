// 【新增文件】运行应用固定命令，收集真实退出码与有界输出。
import { spawn } from 'node:child_process';
import { isAbsolute } from 'node:path';
import { ToolExecutionError } from '@ai-harness/runtime';
import type { CheckCommand, CheckResult } from '../types/code-task';

/** 准备阶段复制可信配置；不让模型改命令或继承父进程凭据环境。 */
export function prepareCheck(command: CheckCommand): CheckCommand {
  if (!isAbsolute(command.executable) || command.executable.includes('\0')
    || !Array.isArray(command.args) || command.args.some((arg) => typeof arg !== 'string' || arg.includes('\0'))) {
    throw new Error('验收必须配置绝对程序路径和合法参数数组。');
  }
  return Object.freeze({ executable: command.executable, args: Object.freeze([...command.args]) });
}

/** 只管理直接子进程；不支持后台后代进程，不是系统沙箱。 */
export async function runCheck(command: CheckCommand, cwd: string, signal?: AbortSignal): Promise<CheckResult> {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const child = spawn(command.executable, [...command.args], {
      cwd, shell: false, env: {}, stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let bytes = 0;
    let stopped: 'timedOut' | 'outputLimit' | undefined;
    let spawnError: Error | undefined;
    const stop = () => { child.kill('SIGKILL'); };
    const onAbort = () => stop();
    const timer = setTimeout(() => { stopped ??= 'timedOut'; stop(); }, 3_000);
    const collect = (chunks: Buffer[], chunk: Buffer) => {
      const room = Math.max(0, 8192 - bytes);
      if (room > 0) chunks.push(chunk.subarray(0, room));
      bytes += Math.min(room, chunk.length);
      if (chunk.length > room) { stopped ??= 'outputLimit'; stop(); }
    };
    child.stdout.on('data', (chunk: Buffer) => collect(stdout, chunk));
    child.stderr.on('data', (chunk: Buffer) => collect(stderr, chunk));
    child.on('error', (error) => { spawnError = error; });
    // close后，直接子进程及其管道已退出，才将结果交回工具。
    child.on('close', (exitCode) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      if (signal?.aborted) { reject(signal.reason); return; }
      if (spawnError) {
        const code = 'code' in spawnError ? spawnError.code : undefined;
        reject(['ENOENT', 'EACCES', 'EPERM'].includes(String(code))
          ? new ToolExecutionError('验收程序无法启动，请检查应用配置。') : spawnError);
        return;
      }
      resolve({ status: stopped ?? (exitCode === 0 ? 'passed' : 'failed'), exitCode,
        stdout: Buffer.concat(stdout).toString('utf8'), stderr: Buffer.concat(stderr).toString('utf8') });
    });
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
}