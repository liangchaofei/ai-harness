// 工具协议保留，实际检查由同一会话提供并记录来源。
import type { ExecutableTool } from '@ai-harness/runtime';
import type { CheckEvidence } from '../types/evidence';
import { objectArgument } from './arguments';

/** 只接收{}；check负责真实执行和来源，工具负责把观察交给Runtime。 */
export function createCheckTool(
  check: (signal?: AbortSignal) => Promise<CheckEvidence>,
): ExecutableTool {
  return {
    name: 'run_check',
    description:
      '运行应用固定验收，参数为{}；反馈含实际结果、revision与stable。之后修改内容需重新验收。',
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    async execute(value, signal) {
      objectArgument(value, []);
      const result = await check(signal);
      return JSON.stringify(result);
    },
  };
}
