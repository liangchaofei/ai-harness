// 【新增文件】独立 MCP 服务，持有发票规则。stdout 由 stdio 传输使用。
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({ name: 'invoice-policy', version: '1.0.0' });

server.registerTool('lookup_invoice_policy', {
  description: '按编号查询发票规则。',
  inputSchema: { rule: z.string().min(1).max(40) },
}, ({ rule }) => {
  if (rule !== 'bulk-discount') {
    return { isError: true, content: [{ type: 'text', text: '规则不存在。' }] };
  }

  return {
    content: [{
      type: 'text',
      text: 'bulk-discount：满 10 件享 10% 折扣，同一笔订单只应用一次折扣。',
    }],
  };
});

await server.connect(new StdioServerTransport());
