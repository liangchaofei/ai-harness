// 在单次工具执行前等待操作者确认。
import { createInterface } from 'node:readline';
import { wrapToolsWithApproval } from '@ai-harness/harness';
import type { ExecutableTool } from '@ai-harness/runtime';

function confirm(prompt: string, signal?: AbortSignal): Promise<boolean> {
  signal?.throwIfAborted();
  if (!process.stdin.isTTY || !process.stderr.isTTY) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const terminal = createInterface({ input: process.stdin, output: process.stderr });
    const close = () => terminal.close();
    terminal.once('close', () => {
      signal?.removeEventListener('abort', close);
      resolve(false);
    });
    terminal.once('SIGINT', close);
    signal?.addEventListener('abort', close, { once: true });
    terminal.question(prompt, (answer) => {
      resolve(answer.trim() === 'yes');
      close();
    });
  });
}

/** 当前调用展示参数并等待答复，每次修改或验收都重新询问。 */
export function requireToolApproval(tools: readonly ExecutableTool[]): ExecutableTool[] {
  // 【修改】终端只负责显示提示和取得本次决定。
  return wrapToolsWithApproval(tools, ({ toolName, args }, signal) => {
    const preview = JSON.stringify(args).replace(/[\u007f-\uffff]/g,
      (character) => '\\u' + character.charCodeAt(0).toString(16).padStart(4, '0'));
    return confirm(`批准本次 ${toolName} ${preview}？输入 yes 执行，其余拒绝：`, signal);
  });
}
