// 【新增文件】从原生窗口取得一项具体工具请求的决定。
import { randomUUID } from 'node:crypto';
import type { ToolApprovalRequest } from '@ai-harness/harness';
import type { DesktopApproval } from './types/task';

/** 同一运行一次只有一个等待项，由主进程拥有，页面只提交 ID 与决定。 */
export function createDesktopApproval(publish: (request: DesktopApproval | null) => void) {
  let pending: { id: string; finish: (allowed: boolean) => void } | undefined;
  return {
    request({ toolName, args }: ToolApprovalRequest, signal?: AbortSignal): Promise<boolean> {
      signal?.throwIfAborted();
      if (pending) {
        throw new Error('已有工具等待批准。');
      }

      const request = { id: randomUUID(), toolName, argumentsText: JSON.stringify(args, null, 2) };
      return new Promise<boolean>((resolve, reject) => {
        const onAbort = () => finish(false);
        function clear() {
          pending = undefined;
          signal?.removeEventListener('abort', onAbort);
        }
        function finish(allowed: boolean) {
          clear();
          resolve(allowed);
          try {
            publish(null);
          } catch {
            // 窗口退出时，清除提示失败不会改变已提交的决定。
          }
        }

        pending = { id: request.id, finish };
        signal?.addEventListener('abort', onAbort, { once: true });
        try {
          publish(request);
        } catch (error) {
          clear();
          reject(error);
        }
      });
    },

    decide(id: unknown, allowed: unknown): boolean {
      if (!pending || id !== pending.id || typeof allowed !== 'boolean') {
        return false;
      }
      pending.finish(allowed);
      return true;
    },
  };
}
