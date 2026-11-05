// 【新增文件】把外部取消与整次期限合为本次运行信号，保留停止来源。
import { performance } from 'node:perf_hooks';
import type { RunControl, ControlStopStatus } from '../types/run-control';

/** runAgent 在合法配置检查后创建；期限包含中间观察，停止选定后 dispose。 */
export function createRunControl(externalSignal?: AbortSignal, timeoutMs?: number): RunControl {
  if (timeoutMs !== undefined && (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 2_147_483_647)) {
    throw new Error('timeoutMs 必须为 1 到 2147483647 的整数毫秒数。');
  }
  const started = performance.now();
  const controller = new AbortController();
  let status: ControlStopStatus | undefined;
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function stop(reason: ControlStopStatus): void {
    if (disposed || status !== undefined) return;
    status = reason;
    controller.abort();
  }
  const onAbort = () => stop('cancelled');
  // 先接已有取消，避免给已经取消的运行安装计时器。
  if (externalSignal?.aborted) onAbort();
  else externalSignal?.addEventListener('abort', onAbort, { once: true });
  if (!status && timeoutMs !== undefined) {
    timer = setTimeout(() => stop('timedOut'), timeoutMs);
  }

  return {
    signal: controller.signal,
    stopStatus() {
      // timer 回调可能被事件循环延迟；动作边界也直接核对单调经过时长。
      if (timeoutMs !== undefined && performance.now() - started >= timeoutMs) stop('timedOut');
      return status;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(timer);
      externalSignal?.removeEventListener('abort', onAbort);
    },
  };
}