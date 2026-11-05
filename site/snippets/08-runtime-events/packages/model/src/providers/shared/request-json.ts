// 两家适配器共用 HTTP 等待和 JSON 读取，不处理消息协议。
import { ModelCallError } from '../../errors/model-call-error';

/** 适配器传入已编码请求；返回未知 JSON，再由各自解码器检查。 */
export async function requestJson(
  url: string, init: RequestInit, fetcher: typeof globalThis.fetch,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetcher(url, init);
  } catch (cause) {
    throw new ModelCallError('transport', '模型服务连接或等待失败。', { cause });
  }
  if (!response.ok) {
    throw new ModelCallError('http', `模型服务请求失败（HTTP ${response.status}）。`, undefined, response.status);
  }
  try {
    return await response.json();
  } catch (cause) {
    // 语法错误与响应体读取中断分开；都不输出原始响应正文。
    if (cause instanceof SyntaxError) {
      throw new ModelCallError('protocol', '模型响应不是合法 JSON。', { cause });
    }
    throw new ModelCallError('transport', '模型响应体读取失败。', { cause });
  }
}
