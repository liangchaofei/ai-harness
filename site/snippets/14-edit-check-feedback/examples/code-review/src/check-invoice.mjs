// 【新增文件】配套业务验收，放在模型可写副本之外，不是Agent机制。
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

try {
  const { invoiceTotal } = await import(pathToFileURL(join(process.argv[2], 'src/checkout/invoice.ts')).href);
  const cases = [
    { price: 100, quantity: 10, expected: 900 },
    { price: 100, quantity: 9, expected: 900 },
    { price: 100, quantity: 1, expected: 100 },
    { price: 100, quantity: 0, expected: 0 },
    { price: 250, quantity: 20, expected: 4500 },
  ].map((input) => {
    const actual = invoiceTotal(input.price, input.quantity);
    return { ...input, actual, passed: actual === input.expected };
  });
  const passed = cases.every((item) => item.passed);
  console.log(JSON.stringify({ passed, cases }));
  process.exitCode = passed ? 0 : 1;
} catch {
  console.log(JSON.stringify({ passed: false, reason: 'source_execution_failed' }));
  process.exitCode = 1;
}
