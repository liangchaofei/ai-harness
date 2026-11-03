// 【新增文件】允许作为模型反馈的已知失败。
/** 工具只把可公开、可处理的说明装入此错误；未知异常仍向入口抛出。 */
export class ToolExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolExecutionError';
  }
}