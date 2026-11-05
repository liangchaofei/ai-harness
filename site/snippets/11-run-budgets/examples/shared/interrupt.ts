// 终端入口把 Ctrl+C 转换为一次运行的取消请求。
/** 应用创建并持有 controller；结束后调用 dispose 移除进程监听。 */
export function createInterrupt() {
  const controller = new AbortController();
  const onInterrupt = () => {
    // 重复 Ctrl+C 仍只表示取消；本函数不强杀进程。
    if (!controller.signal.aborted) {
      console.log('收到 Ctrl+C：请求取消，等待当前操作退出。');
      controller.abort();
    }
  };
  process.on('SIGINT', onInterrupt);
  return {
    signal: controller.signal,
    dispose: () => process.off('SIGINT', onInterrupt),
  };
}
