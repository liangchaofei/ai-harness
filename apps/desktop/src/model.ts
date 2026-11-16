// 只在主进程读取配置，返回给 Runtime 的模型回调。
import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { createConfiguredModelCall, type ModelCall } from '@ai-harness/harness';
import type { DesktopTask } from './tasks';

export class DesktopModelConfigurationError extends Error {
  constructor() {
    super('模型配置不可用，请检查启动环境中的服务名称和凭据。');
  }
}

/** 固定响应不读配置文件。显式选择 live 时才从主进程加载模型配置。 */
export async function selectModel(mode: 'fixed' | 'live', task: DesktopTask): Promise<ModelCall> {
  if (mode === 'live') {
    try {
      const configFile = process.env.AI_HARNESS_DESKTOP_ENV_FILE;
      const fileEnv = configFile ? parseEnv(await readFile(configFile, 'utf8')) : {};
      return createConfiguredModelCall({ ...fileEnv, ...process.env });
    } catch {
      throw new DesktopModelConfigurationError();
    }
  }

  let turn = 0;
  return async ({ messages }) => {
    turn += 1;
    const feedback = messages.at(-1);
    if (feedback?.role === 'toolResult' && feedback.isError) {
      return { role: 'assistant', content: '本次动作未执行成功，已停止。', stopReason: 'stop', toolCalls: [] };
    }
    if (turn === 1) {
      return request('edit-file', 'replace_text', {
        path: task.file, oldText: task.oldText, newText: task.newText,
      });
    }
    if (turn === 2) {
      return request('check-file', 'run_check', {});
    }
    return { role: 'assistant', content: '请查看验收结果。', stopReason: 'stop', toolCalls: [] };
  };
}

function request(id: string, name: string, args: Record<string, unknown>) {
  return {
    role: 'assistant',
    content: '',
    stopReason: 'toolUse',
    toolCalls: [{ id, name, arguments: JSON.stringify(args) }],
  } as const;
}
