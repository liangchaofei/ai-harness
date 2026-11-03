// 【新增文件】审查材料；不会被导入并执行。
export interface CartItem {
  price: number;
  quantity: number;
}

export function total(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}