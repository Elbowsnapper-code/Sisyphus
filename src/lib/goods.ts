export const TRADE_GOODS = [
  {
    group: "Food",
    items: ["Grain", "Wheat", "Barley", "Rice", "Milk", "Cheese", "Fish", "Honey", "Salt", "Wine", "Fruit", "Meat"],
  },
  {
    group: "Fabric",
    items: ["Silk", "Cotton", "Wool", "Linen", "Leather", "Hemp"],
  },
  {
    group: "Resources",
    items: ["Iron", "Timber", "Stone", "Coal", "Gold", "Copper", "Silver", "Oil", "Clay"],
  },
] as const;

export function goodsList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function goodsJoin(list: string[]): string {
  return list.join(", ");
}

export function toggleGood(value: string, item: string): string {
  const list = goodsList(value);
  const key = item.toLowerCase();
  const next = list.some((g) => g.toLowerCase() === key) ? list.filter((g) => g.toLowerCase() !== key) : [...list, item];
  return goodsJoin(next);
}
