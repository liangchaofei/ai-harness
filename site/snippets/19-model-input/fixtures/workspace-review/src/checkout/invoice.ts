// 待审查材料，不在 Agent 进程中执行。
import { discountRate } from '../pricing/policy';

export function invoiceTotal(price: number, quantity: number): number {
  const subtotal = price * quantity;
  const rate = discountRate(quantity);
  return subtotal * (1 - rate) * (1 - rate);
}
