// 【新增文件】配套验收通过公开入口执行；不是Agent框架机制。
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

try {
  const { normalizePath } = await import(
    pathToFileURL(join(process.argv[2], 'src/main.ts')).href
  );
  const cases = [
    { input: '/', expected: '/' },
    { input: '/cart?sort=price', expected: '/cart' },
    { input: '/cart#details', expected: '/cart' },
    { input: '/cart///?sort=price#details', expected: '/cart' },
    { input: '/?next=/cart', expected: '/' },
    { input: '/Cart/%2F/item/', expected: '/Cart/%2F/item' },
    { input: '/a//b', expected: '/a//b' },
    { input: '/cart#details?sort=price', expected: '/cart' },
  ].map((item) => {
    const actual = normalizePath(item.input);
    return { ...item, actual, passed: actual === item.expected };
  });

  const passed = cases.every((item) => item.passed);
  console.log(JSON.stringify({ passed, cases }));
  process.exitCode = passed ? 0 : 1;
} catch {
  console.log(JSON.stringify({ passed: false, reason: 'source_execution_failed' }));
  process.exitCode = 1;
}
