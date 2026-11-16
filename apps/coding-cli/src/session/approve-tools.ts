// 在单次工具执行前等待操作者确认。
import { createInterface } from 'node:readline';
import { ToolExecutionError, type ExecutableTool } from '@ai-harness/runtime';

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
  return tools.map((tool) => {
    if (tool.name !== 'replace_text' && tool.name !== 'run_check') {
      return tool;
    }

    return {
      ...tool,
      async execute(value, signal) {
        const preview = JSON.stringify(value).replace(/[\u007f-\uffff]/g,
          (character) => '\\u' + character.charCodeAt(0).toString(16).padStart(4, '0'));
        const approved = await confirm(
          `批准本次 ${tool.name} ${preview}？输入 yes 执行，其余拒绝：`,
          signal,
        );
        signal?.throwIfAborted();
        if (!approved) {
          throw new ToolExecutionError('该工具请求未获本次批准。');
        }

        return tool.execute(value, signal);
      },
    };
  });
}
