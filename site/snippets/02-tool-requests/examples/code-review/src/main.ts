// #region full
// 【修改】应用提供工具说明，区分待执行请求与可以显示的文本。
import { complete, type Context } from '@ai-harness/model';
import { reviewTools } from './tools';

const model = process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-flash';
const prompt = process.argv[2] ?? '请审查src/cart.ts，先取得源码，再根据内容指出问题。';
const context: Context = {
  systemPrompt: '你是代码审查助手。缺少源码时请求read_file，不编造文件内容或执行结果。',
  messages: [{ role: 'user', content: prompt }],
  // 【新增】只发送动作说明，没有执行函数或文件内容。
  tools: reviewTools,
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

  // 【修改】先拦截截断，避免把不完整的工具参数当作可用请求。
  if (message.stopReason === 'length') throw new Error('输出已截断，本次不接受文本或工具请求。');
  if (message.stopReason === 'toolUse') {
    for (const call of message.toolCalls) {
      console.log('待执行工具请求：', JSON.stringify(call));
    }
    console.log('本篇停在请求阶段，工具执行次数：0；尚未取得源码。');
  } else {
    if (!message.content.trim()) throw new Error('没有可显示的文本，本次不交付回答。');
    console.log('模型文本（text）：', message.content);
  }
} catch (error) {
  console.error('本次调用未交付：', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
// #endregion full
