// 配套商品金额验收，不属于Agent内核。
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

try {
  const { total } = await import(
    pathToFileURL(join(process.argv[2], 'src/cart.ts')).href
  );
  const cases = [
    {
      items: [
        {
          price: 10,
          quantity: 3,
        },
      ],
      expected: 30,
    },
    {
      items: [
        {
          price: 10,
          quantity: 3,
        },
        {
          price: 5,
          quantity: 2,
        },
      ],
      expected: 40,
    },
    {
      items: [],
      expected: 0,
    },
  ].map((input) => {
    const actual = total(input.items);
    return {
      ...input,
      actual,
      passed: actual === input.expected,
    };
  });
  const passed = cases.every((item) => item.passed);
  console.log(
    JSON.stringify({
      passed,
      cases,
    }),
  );
  process.exitCode = passed ? 0 : 1;
} catch {
  console.log(
    JSON.stringify({
      passed: false,
      reason: 'source_execution_failed',
    }),
  );
  process.exitCode = 1;
}
