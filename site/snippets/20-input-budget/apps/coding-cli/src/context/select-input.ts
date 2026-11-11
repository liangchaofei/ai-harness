// 【新增文件】只选择本轮输入，不修改完整历史。
import type { Message } from '@ai-harness/model';

/** 本地 JSON 的 UTF-8 字节数；不含服务协议、工具定义和系统提示。 */
export function messageBytes(messages: readonly Message[]): number {
  return Buffer.byteLength(JSON.stringify(messages), 'utf8');
}

/** 调用与紧随其后的完整反馈构成一个不可拆分的组。 */
function groupHistory(history: readonly Message[]): Message[][] {
  const groups: Message[][] = [];
  let index = 0;

  while (index < history.length) {
    const message = history[index++]!;
    if (message.role === 'toolResult') {
      throw new Error('输入历史存在孤立的工具反馈。');
    }

    const group: Message[] = [message];
    if (message.role === 'assistant') {
      const pending = new Set(message.toolCalls.map((call) => call.id));
      if (pending.size !== message.toolCalls.length) {
        throw new Error('同批工具请求 ID 重复。');
      }
      while (pending.size > 0) {
        const result = history[index++];
        if (result?.role !== 'toolResult' || !pending.delete(result.toolCallId)) {
          throw new Error('输入历史缺少与请求匹配的工具反馈。');
        }
        group.push(result);
      }
    }
    groups.push(group);
  }
  return groups;
}

/** 保留开头的任务消息和尽可能多的连续近期组；最后一组不能省略。 */
export function selectInput(history: readonly Message[], budget: number): Message[] {
  if (!Number.isSafeInteger(budget) || budget < 1 || history[0]?.role !== 'user') {
    throw new Error('输入预算必须为正整数，历史必须以任务消息开始。');
  }
  const groups = groupHistory(history);
  const task: Message[] = [];
  while (groups[0]?.[0]?.role === 'user') {
    task.push(...groups.shift()!);
  }
  let recent = groups.pop() ?? [];

  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const candidate = [...groups[index]!, ...recent];
    if (messageBytes([...task, ...candidate]) > budget) {
      break;
    }
    recent = candidate;
  }
  return [...task, ...recent];
}
