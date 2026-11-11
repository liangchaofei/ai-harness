// 【新增文件】CLI自有的显示函数，不接管运行状态。
import { inspect } from 'node:util';
import type { RunEvent } from '@ai-harness/runtime';

/** 只传入允许展示的数据；本函数不是脱敏器，也不是稳定机器协议。 */
export function printBlock(title: string, value: unknown): void {
  const text =
    typeof value === 'string'
      ? value
      : inspect(value, {
          colors: false,
          depth: null,
          customInspect: false,
          getters: false,
          compact: false,
        });
  console.log(`\n── ${title} ──\n${text}`);
}

/** main注册为观察器；事件中的序号用于关联同一次运行的进度。 */
export function printProgress(event: RunEvent): void {
  const prefix = `[${event.runId.slice(0, 8)} #${event.sequence}]`;
  if (event.type === 'model_start') {
    console.log(`${prefix} 模型调用 ${event.modelCall}`);
  } else if (event.type === 'tool_start') {
    console.log(`${prefix} 开始 ${event.toolName} / ${event.toolCallId}`);
  } else if (event.type === 'tool_end') {
    console.log(
      `${prefix} ${event.toolName}：${event.isError ? '失败反馈' : '成功结果'}`,
    );
  } else if (event.type === 'run_end') {
    console.log(`${prefix} 运行停止：${event.status}`);
  }
}
