// 【新增文件】将可信的本地会话日志还原为可接续的消息。
import { readFile, stat } from 'node:fs/promises';
import type { Message, ToolCall } from '@ai-harness/model';

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toolCall(value: unknown): value is ToolCall {
  return record(value) && typeof value.id === 'string' && value.id.length > 0 &&
    typeof value.name === 'string' && typeof value.arguments === 'string';
}

function message(value: unknown): value is Message {
  if (!record(value) || typeof value.content !== 'string') {
    return false;
  }
  if (value.role === 'user') {
    return true;
  }
  if (value.role === 'assistant') {
    return (value.stopReason === 'stop' || value.stopReason === 'toolUse' ||
      value.stopReason === 'length') && Array.isArray(value.toolCalls) &&
      value.toolCalls.every(toolCall);
  }
  return value.role === 'toolResult' && typeof value.toolCallId === 'string' &&
    typeof value.toolName === 'string' && typeof value.isError === 'boolean';
}

/** 每段必须从用户消息起步，以完成回答收尾，工具请求与反馈逐一配对。 */
function completeSegment(messages: readonly Message[]): boolean {
  const last = messages.at(-1);
  if (messages[0]?.role !== 'user' || last?.role !== 'assistant' ||
      last.stopReason !== 'stop' || last.toolCalls.length !== 0 || !last.content.trim()) {
    return false;
  }

  const pending = new Map<string, string>();
  for (const item of messages) {
    if (item.role === 'toolResult') {
      if (pending.get(item.toolCallId) !== item.toolName) {
        return false;
      }
      pending.delete(item.toolCallId);
    } else {
      if (pending.size > 0) {
        return false;
      }
      if (item.role === 'assistant') {
        for (const call of item.toolCalls) {
          if (pending.has(call.id)) {
            return false;
          }
          pending.set(call.id, call.name);
        }
      }
    }
  }
  return pending.size === 0;
}

/** 只接受第 25 篇写出的版本 1 日志，按行还原各段新增消息。 */
export async function readSessionHistory(path: string, signal?: AbortSignal): Promise<Message[]> {
  const info = await stat(path);
  const limit = 64 * 1024;
  if (!info.isFile() || info.size > limit) {
    throw new Error('会话日志应为不超过 64 KiB 的文件。');
  }

  const text = await readFile(path, { encoding: 'utf8', signal });
  if (Buffer.byteLength(text, 'utf8') > limit || !text.endsWith('\n')) {
    throw new Error('日志超限或最后一行未写完。');
  }

  const [first, ...lines] = text.slice(0, -1).split('\n');
  const header: unknown = JSON.parse(first!);
  if (!record(header) || header.type !== 'session' || header.version !== 1 ||
      typeof header.workspace !== 'string' || lines.length === 0) {
    throw new Error('缺少可接续的版本 1 会话记录。');
  }

  const history: Message[] = [];
  for (const line of lines) {
    const entry: unknown = JSON.parse(line);
    if (!record(entry) || entry.type !== 'run' || entry.status !== 'answered' ||
        !Array.isArray(entry.messages) || !entry.messages.every(message) ||
        !completeSegment(entry.messages)) {
      throw new Error('运行段未正常回答或工具反馈不完整。');
    }
    history.push(...entry.messages);
  }
  return history;
}
