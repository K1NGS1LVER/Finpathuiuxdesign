export const formatInr = (value: number): string =>
  `₹${Math.round(Math.max(0, value)).toLocaleString('en-IN')}`;

export function formatInrCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 10_000_000) return `${sign}₹${(abs / 10_000_000).toFixed(1)}Cr`;
  if (abs >= 100_000) return `${sign}₹${(abs / 100_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(0)}K`;
  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
}
