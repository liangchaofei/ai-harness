// 完整响应与流式响应共用连接和 HTTP 状态检查。
import { ModelCallError } from '../../errors/model-call-error';

/** 只取得响应头；响应体由 JSON 或 SSE 读取函数继续消费。 */
export async function requestResponse(
  url: string,
  init: RequestInit,
  fetcher: typeof globalThis.fetch,
): Promise<Response> {
  // 不进入已经取消的 HTTP 等待。
  init.signal?.throwIfAborted();
  let response: Response;
  try {
    response = await fetcher(url, init);
  } catch (cause) {
    throw new ModelCallError('transport', '模型服务连接或等待失败。', { cause });
  }
  // 自定义 fetch 迟到返回时释放未使用响应体。
  if (init.signal?.aborted) {
    await response.body?.cancel().catch(() => undefined);
    init.signal.throwIfAborted();
  }
  if (!response.ok) {
    // 不读取错误正文；释放未使用的响应体，也不让清理失败覆盖 HTTP 类别。
    await response.body?.cancel().catch(() => undefined);
    throw new ModelCallError(
      'http',
      `模型服务请求失败（HTTP ${response.status}）。`,
      undefined,
      response.status,
    );
  }
  return response;
}
