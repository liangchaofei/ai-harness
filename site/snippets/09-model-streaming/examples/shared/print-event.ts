// 应用将事件摘要翻译成进度行，Runtime 不依赖终端。
import type { RunEvent } from '@ai-harness/runtime';
import { logLine } from './terminal';

/** 每个事件显示一行；保留原事件名、运行 ID 前缀与顺序号，方便对应程序位置。 */
export function printEvent(event: RunEvent): void {
  const label = `[${event.runId.slice(0, 8)} #${String(event.sequence).padStart(2, '0')}] ${event.type}`;
  switch (event.type) {
    case 'run_start':
      logLine(label, `运行开始 · runId=${event.runId}`);
      break;
    case 'model_start':
      logLine(label, `模型调用 ${event.modelCall}：即将开始等待`);
      break;
    // 【新增】每片单独显示，保留调用身份，不把片段说成完整回答。
    case 'model_text_delta':
      logLine(label, `文字预览：${JSON.stringify(event.text)}`);
      break;
    case 'model_end':
      logLine(label, `模型调用 ${event.modelCall}：完整响应到达 · ${event.stopReason} · 请求工具 ${event.toolCallCount} 项`);
      break;
    case 'model_failed':
      logLine(label, `模型调用 ${event.modelCall}：失败 · ${event.code}`);
      break;
    case 'tool_start':
      logLine(label, `模型调用 ${event.modelCall} · ${event.toolName} / ${event.toolCallId}：开始检查和处理`);
      break;
    case 'tool_end':
      logLine(label, `模型调用 ${event.modelCall} · ${event.toolName} / ${event.toolCallId}：${event.isError ? '失败反馈' : '成功结果'}`);
      break;
    case 'tool_failed':
      logLine(label, `模型调用 ${event.modelCall} · ${event.toolName} / ${event.toolCallId}：异常停止 · ${event.code}`);
      break;
    case 'run_end':
      logLine(label, `运行停止 · ${event.status} · 模型调用 ${event.modelCalls} 次${event.failureCode ? ` · ${event.failureCode}` : ''}`);
      break;
  }
}
