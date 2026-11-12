// 可选计划工具与只读入口共享同一份本地进度记录。
import type { PlanSession, PlanSnapshot } from '../types/plan';
import { ToolExecutionError } from '../errors/tool-execution-error';
import { createPlanParser, planParameters } from './parameters';

/** 应用创建后将tool注入运行；没有注入时原循环不受影响。 */
export function createPlanSession(): PlanSession {
  const parse = createPlanParser();
  let current: PlanSnapshot = {
    revision: 0,
    explanation: '',
    steps: [],
  };
  const read = (): PlanSnapshot => structuredClone(current);
  return {
    read,
    tool: {
      name: 'update_plan',
      description:
        '保存或修订简短计划。expectedRevision使用上次成功返回的revision，首次为0；steps完整替换列表，最多一项进行中。根据实际反馈更新，可把完成项重新打开。计划完成不代表验收通过。',
      parameters: structuredClone(planParameters),
      async execute(value, signal) {
        signal?.throwIfAborted();
        const update = parse(value);
        if (update.expectedRevision !== current.revision) {
          throw new ToolExecutionError(
            `计划版本过期，当前revision为${current.revision}，请根据最近反馈重新更新。`,
            'invalid_arguments',
          );
        }
        signal?.throwIfAborted();
        // 只有检查全通过才替换；拒绝、取消不留下半份计划。
        current = {
          revision: current.revision + 1,
          explanation: update.explanation,
          steps: update.steps,
        };
        return JSON.stringify(read());
      },
    },
  };
}
