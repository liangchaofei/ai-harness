// 【新增文件】仅供本地协议观察；所有响应从 fixtures 读取，不调用网络。
import { readFile } from 'node:fs/promises';
import type { ModelProvider } from '@ai-harness/model';

/** 检查入口创建并传给 complete；样本耗尽就失败，不回退到真实 fetch。 */
export async function createProtocolFetch(provider: ModelProvider): Promise<typeof globalThis.fetch> {
  const fixture = provider === 'deepseek' ? 'deepseek.json' : 'anthropic.json';
  const samples: unknown = JSON.parse(await readFile(
    new URL(`../../../fixtures/model-protocol/${fixture}`, import.meta.url), 'utf8',
  ));
  if (!Array.isArray(samples)) throw new Error('本地响应材料必须是数组。');
  const endpoint = provider === 'deepseek'
    ? 'https://api.deepseek.com/chat/completions'
    : 'https://api.anthropic.com/v1/messages';
  let index = 0;
  return async (input, init) => {
    if (input !== endpoint || typeof init?.body !== 'string' || index >= samples.length) {
      throw new Error('请求不符合本地协议样本范围；未发送网络请求。');
    }
    // 只观察正文，不打印含 API Key 的请求头。这个入口使用占位密钥。
    console.log(`本地请求正文 ${index + 1}：`, init.body);
    const sample: unknown = samples[index++];
    console.log(`本地原始响应 ${index}：`, JSON.stringify(sample));
    return new Response(JSON.stringify(sample), { headers: { 'Content-Type': 'application/json' } });
  };
}
