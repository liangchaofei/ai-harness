// 【新增文件】启动前检查工具清单、快照说明并编译 schema。
import Ajv from 'ajv';
import type { ExecutableTool } from '../types/tools';
import type { RegisteredTool } from '../types/tool-registry';
import { ToolBatchError } from '../errors/tool-batch-error';

/** runAgent 每次启动调用一次；配置失败发生在任何模型或工具动作之前。 */
export function createToolRegistry(tools: readonly ExecutableTool[]): ReadonlyMap<string, RegisteredTool> {
  const registry = new Map<string, RegisteredTool>();
  const ajv = new Ajv({ strict: true, addUsedSchema: false });
  try {
    for (const tool of tools) {
      if (typeof tool.name !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(tool.name) || registry.has(tool.name) ||
          typeof tool.description !== 'string' || !tool.description.trim() || typeof tool.execute !== 'function') {
        throw new Error('工具名称、说明或执行函数无效。');
      }
      const parameters = structuredClone(tool.parameters);
      if (parameters.type !== 'object') throw new Error('工具参数 schema 根类型必须为 object。');
      const validate = ajv.compile(parameters);
      if ('$async' in validate && validate.$async) throw new Error('当前只接收同步参数 schema。');
      registry.set(tool.name, {
        name: tool.name, description: tool.description, parameters,
        execute: tool.execute.bind(tool), validate,
      });
    }
    return registry;
  } catch (cause) {
    // 不把 Ajv 的原始错误、schema 或应用配置直接发送给模型。
    throw new ToolBatchError({ code: 'tool_configuration', message: '本地工具配置无效，尚未开始模型调用。' }, [], { cause });
  }
}