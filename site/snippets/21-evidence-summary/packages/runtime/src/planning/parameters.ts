// 同一份参数规则用于工具说明和本会话直接调用检查。
import Ajv from 'ajv';
import { ToolExecutionError } from '../errors/tool-execution-error';
import type { PlanUpdate } from '../types/plan';

/** 模型看到的结构规则；跨步骤约束在下方解析时检查。 */
export const planParameters = {
  type: 'object',
  properties: {
    expectedRevision: {
      type: 'integer',
      minimum: 0,
      maximum: Number.MAX_SAFE_INTEGER,
    },
    explanation: {
      type: 'string',
      minLength: 1,
      maxLength: 240,
    },
    steps: {
      type: 'array',
      minItems: 1,
      maxItems: 6,
      items: {
        type: 'object',
        properties: {
          step: {
            type: 'string',
            minLength: 1,
            maxLength: 160,
          },
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed'],
          },
        },
        required: ['step', 'status'],
        additionalProperties: false,
      },
    },
  },
  required: ['expectedRevision', 'explanation', 'steps'],
  additionalProperties: false,
};

/** 工厂每会话编译一次；直接调用tool.execute也不会跳过字段检查。 */
export function createPlanParser(): (value: unknown) => PlanUpdate {
  const validate = new Ajv({
    strict: true,
    ownProperties: true,
  }).compile<PlanUpdate>(planParameters);
  return (value) => {
    if (!validate(value)) {
      throw new ToolExecutionError('计划参数不符合说明。', 'invalid_arguments');
    }
    const steps = value.steps.map(({ step, status }) => ({
      step: step.trim(),
      status,
    }));
    const explanation = value.explanation.trim();
    if (
      !explanation ||
      steps.some(({ step }) => !step) ||
      new Set(steps.map(({ step }) => step)).size !== steps.length ||
      steps.filter(({ status }) => status === 'in_progress').length > 1
    ) {
      throw new ToolExecutionError(
        '计划说明与步骤不可空白或重名，且最多一项进行中。',
        'invalid_arguments',
      );
    }
    return {
      expectedRevision: value.expectedRevision,
      explanation,
      steps,
    };
  };
}
