/** Display-only. Does not change the underlying number. */
export function emptyMark(): string {
  return '—';
}

/** Page locale for number display. German pages write 1.000,50 €, English pages €1,000.50. */
export type NumberLocale = 'en' | 'de';

/** German euro suffix: no-break space (U+00A0) + €, so "1,40 €" never wraps before the symbol. */
export const EURO_SUFFIX_DE = `${String.fromCharCode(0xa0)}€`;

/** German decimal comma and thousands dot. English text is returned untouched. */
function localizeDigits(text: string, locale: NumberLocale): string {
  if (locale !== 'de') return text;
  return text.replace(/[.,]/g, (mark) => (mark === '.' ? ',' : '.'));
}

/** Euro amounts share one spelling: €0.00, €0.05, no space after the symbol. German: 0,05 € with a no-break space. */
export function formatEuro(value: number | null | undefined, digits = 2, locale: NumberLocale = 'en'): string {
  if (value == null) return 'xx';
  const text = digits <= 2 ? value.toFixed(2) : value.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
  if (locale === 'de') return `${localizeDigits(text, 'de')}${EURO_SUFFIX_DE}`;
  return `€${text}`;
}

/** Whole counts (RPM, TPM, plan prices): 400,000 in English, 400.000 in German. */
export function formatInteger(value: number, locale: NumberLocale = 'en'): string {
  return value.toLocaleString(locale === 'de' ? 'de-DE' : 'en-US');
}

/** A number written in English notation in the source (0.20, 102.4K, 1.05M), re-spelled for the page locale. */
export function formatDecimalText(text: string, locale: NumberLocale = 'en'): string {
  return localizeDigits(text, locale);
}
