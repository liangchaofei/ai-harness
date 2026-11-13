// 从完整历史选择本轮消息。
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

/** 保留开头任务、最新追问和最后一组，其余按完整的近期批次取舍。 */
export function selectInput(history: readonly Message[], budget: number): Message[] {
  if (!Number.isSafeInteger(budget) || budget < 1 || history[0]?.role !== 'user') {
    throw new Error('输入预算必须为正整数，历史必须以任务消息开始。');
  }
  const groups = groupHistory(history);
  const task: Message[] = [];
  while (groups[0]?.[0]?.role === 'user') {
    task.push(...groups.shift()!);
  }
  // 【修改】最新追问可能早于最后一批工具结果，单独保留。
  const followUpIndex = groups.map((group) => group[0]!.role).lastIndexOf('user');
  let recentStart = Math.max(0, groups.length - 1);

  // 当近期窗口尚未包含追问，把它放在近期窗口前。窗口包含它时只取一次。
  const inputFrom = (start: number): Message[] => [
    ...task,
    ...(followUpIndex >= 0 && followUpIndex < start ? groups[followUpIndex]! : []),
    ...groups.slice(start).flat(),
  ];

  for (let index = recentStart - 1; index >= 0; index -= 1) {
    if (messageBytes(inputFrom(index)) > budget) {
      break;
    }
    recentStart = index;
  }
  return inputFrom(recentStart);
}
