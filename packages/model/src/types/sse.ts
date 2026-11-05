// 【新增文件】共享读取器交给服务适配器的 SSE 数据帧，仅包内使用。
/** readSse 创建；不包含传输分块或完整模型消息。 */
export interface SseFrame {
  /** event 行的名称；没有该行时为空字符串。 */
  event: string;
  /** 同一帧的 data 行以换行连接；之后才由具体服务解析 JSON。 */
  data: string;
}