// 【新增文件】把任意字节分块还原为完整 SSE 帧，不认识工具或模型字段。
import { ModelCallError } from '../../errors/model-call-error';
import type { SseFrame } from '../../types/sse';

/** 适配器传入响应；逐帧消费，退出时取消剩余读取并释放 reader。 */
export async function* readSse(response: Response): AsyncGenerator<SseFrame> {
  if (!response.body || !response.headers.get('content-type')?.toLowerCase().startsWith('text/event-stream')) {
    await response.body?.cancel().catch(() => undefined);
    throw new ModelCallError('protocol', '模型流缺少 SSE 响应体或内容类型。');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let buffer = '';
  let event = '';
  let data: string[] = [];
  let received = 0;
  try {
    while (true) {
      let part: ReadableStreamReadResult<Uint8Array>;
      try {
        part = await reader.read();
      } catch (cause) {
        throw new ModelCallError('transport', '模型流读取中断。', { cause });
      }
      let text: string;
      try {
        // stream:true 保留尚未凑齐的 UTF-8 字节；done 时刷新检查残缺字符。
        text = decoder.decode(part.value, { stream: !part.done });
      } catch (cause) {
        throw new ModelCallError('protocol', '模型流包含无效 UTF-8。', { cause });
      }
      received += text.length;
      if (received > 2 * 1024 * 1024) throw new ModelCallError('protocol', '模型流超过当前字符上限。');
      buffer += text;
      while (true) {
        const end = /\r\n|\r|\n/.exec(buffer);
        if (!end || (!part.done && end[0] === '\r' && end.index === buffer.length - 1)) break;
        const line = buffer.slice(0, end.index);
        buffer = buffer.slice(end.index + end[0].length);
        if (line === '') {
          if (data.length > 0) yield { event, data: data.join('\n') };
          event = '';
          data = [];
        } else if (!line.startsWith(':')) {
          const colon = line.indexOf(':');
          const field = colon < 0 ? line : line.slice(0, colon);
          const value = colon < 0 ? '' : line.slice(colon + 1).replace(/^ /, '');
          if (field === 'event') event = value;
          if (field === 'data') data.push(value);
          // id/retry 与未知字段不参与本次模型调用，不实现 EventSource 重连。
        }
      }
      if (part.done) break;
    }
    // 未以空行结束的尾部不当作完整帧；服务适配器还会检查终止标记。
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
