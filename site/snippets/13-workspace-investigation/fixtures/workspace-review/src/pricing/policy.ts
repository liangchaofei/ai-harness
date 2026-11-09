// 【新增文件】满10件使用一次10%折扣。
export function discountRate(quantity: number): number {
  return quantity >= 10 ? 0.1 : 0;
}
