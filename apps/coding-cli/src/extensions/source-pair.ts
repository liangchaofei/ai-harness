// 【新增文件】用宿主提供的读取能力并排调查入口与候选实现。
import { ToolExecutionError, type ExecutableTool } from '@ai-harness/runtime';

// 每份预览最多保留的 UTF-16 代码单元，避免把两份全文一起送回模型。
const PREVIEW_LIMIT = 1_800;

/** 宿主注入当前副本的 read_file 执行函数。扩展只使用这一读取入口。 */
export function createSourcePairTool(read: ExecutableTool['execute']): ExecutableTool {
  return {
    name: 'read_source_pair',
    description: '并排读取入口和候选实现的带行号预览。两个路径都必须位于工作区索引。调用者自行核对文件间的引用关系。',
    parameters: {
      type: 'object',
      properties: {
        entry: { type: 'string', minLength: 1, maxLength: 240, description: '公开入口的相对路径' },
        candidate: { type: 'string', minLength: 1, maxLength: 240, description: '候选实现的相对路径' },
      },
      required: ['entry', 'candidate'],
      additionalProperties: false,
    },
    async execute(value, signal) {
      if (typeof value !== 'object' || value === null ||
          !('entry' in value) || typeof value.entry !== 'string' ||
          !('candidate' in value) || typeof value.candidate !== 'string') {
        throw new ToolExecutionError('需要入口和候选实现两个路径。', 'invalid_arguments');
      }

      signal?.throwIfAborted();
      const entry = preview(await read({ path: value.entry }, signal));
      signal?.throwIfAborted();
      const candidate = preview(await read({ path: value.candidate }, signal));
      return JSON.stringify({ entry, candidate });
    },
  };
}

/** 将已有带行号文本变为有界预览，由模型据此决定是否单独读取全文。 */
function preview(text: string) {
  return {
    text: text.slice(0, PREVIEW_LIMIT),
    truncated: text.length > PREVIEW_LIMIT,
  };
}
