// 【新增文件】只根据已记录的历史回答一条新问题。
import { runAgent, type ModelCall } from '@ai-harness/runtime';
import { readSessionHistory } from './read-session-log';

/** 日志验证通过后才创建模型连接。本段没有工作副本和可执行工具。 */
export async function resumeConversation(
  path: string,
  question: string,
  createCallModel: () => ModelCall,
  signal: AbortSignal,
) {
  const history = await readSessionHistory(path, signal);
  signal.throwIfAborted();
  return runAgent({
    messages: [...history, { role: 'user', content: question }],
    systemPrompt: '根据保存的会话回答最新问题。历史反馈只说明当时的事实；没有依据时明确说明。',
    tools: [],
    callModel: createCallModel(),
    maxModelCalls: 1,
    maxToolCalls: 0,
    timeoutMs: 60_000,
    signal,
  });
}
