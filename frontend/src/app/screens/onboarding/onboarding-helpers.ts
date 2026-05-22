export function weightedAvgGrowth(
  items: Array<{ amount: string; growthRate: string }>
): number {
  const totalAmt = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  if (totalAmt === 0) return 0;
  const weighted = items.reduce(
    (s, i) => s + (parseFloat(i.amount) || 0) * (parseFloat(i.growthRate) || 0),
    0
  );
  return weighted / totalAmt;
}

export function avgVariabilityPercent(
  items: Array<{ amount: string; variabilityPercent: string }>
): number {
  const totalAmt = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  if (totalAmt === 0) return 0;
  const weighted = items.reduce(
    (s, i) => s + (parseFloat(i.amount) || 0) * (parseFloat(i.variabilityPercent) || 0),
    0
  );
  return weighted / totalAmt;
}
