/** Display-only. Does not change the underlying number. */
export function emptyMark(): string {
  return '—';
}

/** Euro amounts share one spelling: €0.00, €0.05, no space after the symbol. */
export function formatEuro(value: number | null | undefined, digits = 2): string {
  if (value == null) return 'xx';
  if (digits <= 2) return `€${value.toFixed(2)}`;
  const text = value.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
  return `€${text}`;
}
