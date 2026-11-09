// 【新增文件】两个入口共用一次副本任务的运行、报告和取消清理。
import { runAgent, type ModelCall } from '@ai-harness/runtime';
import { createInterrupt } from '../../shared/interrupt';
import { printEvent } from '../../shared/print-event';
import { createRepairSession } from './repair-session';
import { reportRepair } from './repair-report';
import type { RepairSession } from './types/repair-session';

/** 真实或固定模型连接由入口提供，副本始终由本应用创建。 */
export async function runRepair(createCallModel: () => ModelCall): Promise<void> {
  const interrupt = createInterrupt();
  let session: RepairSession | undefined;
  try {
    session = await createRepairSession(interrupt.signal);
    const result = await runAgent({ ...session.input, callModel: createCallModel(),
      maxModelCalls: 6, maxToolCalls: 8, timeoutMs: 60_000,
      signal: interrupt.signal, onEvent: printEvent });
    const ready = await reportRepair(session, result);
    if (result.status === 'cancelled') process.exitCode = 130;
    else if (!ready) process.exitCode = 1;
  } catch {
    console.error('副本准备、运行或报告失败，请在入口断点检查；未输出原始异常正文。');
    process.exitCode = 1;
  } finally {
    interrupt.dispose();
    if (session) console.log('工作副本保留在：', session.root);
  }
}