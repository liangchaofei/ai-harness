// 【新增文件】把受信任的发票 MCP 服务适配成当前 Runtime 的工具。
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ToolExecutionError, type ExecutableTool } from '@ai-harness/runtime';

const REMOTE_TOOL = 'lookup_invoice_policy';
// SDK 的初始化、发现和单次调用分别使用这个毫秒上限。
const REQUEST_TIMEOUT_MS = 5_000;

/** CLI 持有连接直到任务结束，工具执行函数复用同一 MCP 客户端。 */
export async function openInvoicePolicy(signal: AbortSignal) {
  signal.throwIfAborted();
  const client = new Client({ name: 'ai-harness', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL('../mcp/invoice-policy.mjs', import.meta.url))],
    maxBufferSize: 16 * 1024,
  });

  try {
    await client.connect(transport, { signal, timeout: REQUEST_TIMEOUT_MS });
    const { tools } = await client.listTools(undefined, { signal, timeout: REQUEST_TIMEOUT_MS });
    if (!tools.some((tool) => tool.name === REMOTE_TOOL)) {
      throw new Error('发票 MCP 服务缺少已登记的规则查询工具。');
    }
  } catch (error) {
    await client.close();
    throw error;
  }

  const tool: ExecutableTool = {
    name: 'read_invoice_policy',
    description: '查询发票规则。满件折扣的规则编号为 bulk-discount。',
    parameters: {
      type: 'object',
      properties: { rule: { type: 'string', minLength: 1, maxLength: 40 } },
      required: ['rule'],
      additionalProperties: false,
    },
    async execute(value, toolSignal) {
      if (typeof value !== 'object' || value === null ||
          !('rule' in value) || typeof value.rule !== 'string' ||
          value.rule.length === 0 || value.rule.length > 40) {
        throw new ToolExecutionError('需要有效的发票规则编号。', 'invalid_arguments');
      }

      const result = await client.callTool({
        name: REMOTE_TOOL,
        arguments: { rule: value.rule },
      }, undefined, { signal: toolSignal, timeout: REQUEST_TIMEOUT_MS }).catch(() => {
        toolSignal?.throwIfAborted();
        throw new ToolExecutionError('发票规则服务暂时不可用。');
      });

      if (result.isError) {
        throw new ToolExecutionError('发票规则服务未能返回所请求的规则。');
      }
      const content = Array.isArray(result.content) ? result.content : [];
      const item = content[0];
      if (content.length !== 1 || item?.type !== 'text' ||
          typeof item.text !== 'string' || item.text.length > 1_000) {
        throw new ToolExecutionError('发票规则服务返回的内容格式无效。');
      }
      return item.text;
    },
  };

  return { tool, close: () => client.close() };
}
