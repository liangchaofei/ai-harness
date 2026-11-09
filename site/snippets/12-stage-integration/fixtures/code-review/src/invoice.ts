// 【新增文件】审查材料：实际不会被 Agent 进程导入执行。
import { discountRate } from './pricing';

export function invoiceTotal(price: number, quantity: number): number {
  const subtotal = price * quantity;
  const rate = discountRate(quantity);
  return subtotal * (1 - rate) * (1 - rate);
}
