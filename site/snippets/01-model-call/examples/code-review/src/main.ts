// #region full
// 【新增文件】示例提供上下文和配置，并决定本次结果是否足以展示。
import { complete, type Context } from '@ai-harness/model';

const model = process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-flash';
const prompt = process.argv[2] ??
  '请指出这段TypeScript函数的一个问题：function first(items: string[]) { return items[0].toUpperCase(); }';
const context: Context = {
  systemPrompt: '你是代码审查助手。只根据用户消息中的代码说明问题，不声称读取本地文件或运行过代码。回答简短。',
  messages: [{ role: 'user', content: prompt }],
};

try {
  console.log('请求模型（model）：', model);
  console.log('应用上下文（context）：', JSON.stringify(context, null, 2));
  const message = await complete(context, {
    apiKey: process.env.DEEPSEEK_API_KEY?.trim() ?? '',
    model,
    maxTokens: 256,
  });
  console.log('模型消息（message）：', JSON.stringify(message));

  // 截断是实际返回的结果状态，不伪装成网络失败或完整回答。
  if (message.stopReason !== 'stop') throw new Error('输出已截断，本次不交付为完整回答。');
  if (!message.content.trim()) throw new Error('没有可显示的文本，本次不交付回答。');
  console.log('模型文本（text）：', message.content);
} catch (error) {
  console.error('本次调用未交付：', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
// #endregion full
