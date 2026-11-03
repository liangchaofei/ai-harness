// 【新增文件】执行一条模型消息内的工具请求，不请求模型、不修改历史。
import type { AssistantMessage, ToolResultMessage } from '@ai-harness/model';
import type { ExecutableTool } from './types/tools';
import { ToolExecutionError } from './tool-error';

/** 应用调用；整批按顺序完成后返回结果，应用再保存并请求模型。 */
export async function executeTools(
  message: AssistantMessage,
  tools: readonly ExecutableTool[],
): Promise<ToolResultMessage[]> {
  if (message.stopReason !== 'toolUse' || message.toolCalls.length === 0) {
    throw new Error('只执行完整的 toolUse 消息。');
  }

  // 在任何执行之前检查歧义；不会执行前几项才发现后面 ID 重复。
  const registry = new Map(tools.map((tool) => [tool.name, tool]));
  if (registry.size !== tools.length) throw new Error('本地工具名称不能重复。');
  const ids = message.toolCalls.map((call) => call.id);
  if (ids.some((id) => !id.trim()) || new Set(ids).size !== ids.length) {
    throw new Error('本批请求 ID 为空或重复。');
  }

  const results: ToolResultMessage[] = [];
  for (const call of message.toolCalls) {
    let content: string;
    let isError = false;
    try {
      const tool = registry.get(call.name);
      if (!tool) throw new ToolExecutionError('没有注册该工具。');

      let argumentsValue: unknown;
      try {
        argumentsValue = JSON.parse(call.arguments);
      } catch {
        throw new ToolExecutionError('工具参数不是合法 JSON，请重新生成。');
      }
      content = await tool.execute(argumentsValue);
      if (typeof content !== 'string') throw new Error('工具没有返回文本。');
    } catch (error) {
      // 只反馈明确归类的失败，避免把程序缺陷或敏感异常正文发送给模型。
      if (!(error instanceof ToolExecutionError)) throw error;
      content = error.message;
      isError = true;
    }
    results.push({
      role: 'toolResult', toolCallId: call.id, toolName: call.name, content, isError,
    });
  }
  return results;
}
