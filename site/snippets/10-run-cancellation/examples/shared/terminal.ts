// 两个示例共用的终端排版，不进入 Runtime 或模型包。
import { inspect } from 'node:util';

/** 输出一条进度；调用方负责提供可展示的摘要，不在这里改变运行数据。 */
export function logLine(label: string, detail: string): void {
  console.log(`  ${label}  ${detail}`);
}

/** 分块展示文本或对象；只用于人阅读，不作为 JSON 协议、持久化或脱敏工具。 */
export function logBlock(title: string, value?: unknown): void {
  console.log(`\n── ${title} ──`);
  if (value === undefined) return;

  // 文本保留实际换行；对象按多行排版，不调用对象自定义的打印方法。
  const text = typeof value === 'string' ? value : inspect(value, {
    colors: false,
    depth: null,
    compact: false,
    maxArrayLength: null,
    maxStringLength: null,
    customInspect: false,
    getters: false,
  });
  console.log(text.split('\n').map((line) => `  ${line}`).join('\n'));
}
