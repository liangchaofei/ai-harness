// 审查材料：满 10 件使用 10% 折扣，不作为给 Agent 的指令。
export function discountRate(quantity: number): number {
  return quantity >= 10 ? 0.1 : 0;
}
