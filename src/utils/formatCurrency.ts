/**
 * Money formatting for the storefront.
 *
 * The API returns the currency per product (PKR for this catalog), so the
 * amount must always be rendered with the currency the backend sent — never
 * assumed. `Intl.NumberFormat` handles symbol placement, grouping and the
 * correct fraction digits; a manual fallback keeps this working on any JS
 * engine without full ICU.
 */

interface CurrencyMeta {
  symbol: string;
  /** Symbol goes before the number (PKR, USD) or after it (SEK). */
  position: 'prefix' | 'suffix';
  /** Trailing space between symbol and amount, e.g. "Rs 2,450". */
  separator: string;
}

const CURRENCY_META: Record<string, CurrencyMeta> = {
  PKR: { symbol: 'Rs', position: 'prefix', separator: ' ' },
  USD: { symbol: '$', position: 'prefix', separator: '' },
  EUR: { symbol: '€', position: 'prefix', separator: '' },
  GBP: { symbol: '£', position: 'prefix', separator: '' },
  AED: { symbol: 'AED', position: 'prefix', separator: ' ' },
  SAR: { symbol: 'SAR', position: 'prefix', separator: ' ' },
};

const FALLBACK_META: CurrencyMeta = { symbol: '', position: 'prefix', separator: ' ' };

const metaFor = (currency: string): CurrencyMeta => CURRENCY_META[currency.toUpperCase()] ?? FALLBACK_META;

const groupThousands = (digits: string): string => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * Amounts keep decimals only when they have them: 2450 → "2,450", 8.5 → "8.50".
 * Catalogue prices are genuinely fractional, so rounding them away would lie.
 */
const formatAmount = (amount: number): string => {
  const rounded = Math.round(amount * 100) / 100;
  const hasFraction = Math.abs(rounded % 1) > 1e-9;
  const [whole, fraction = ''] = Math.abs(rounded).toFixed(2).split('.');
  const negative = rounded < 0;
  const grouped = groupThousands(whole);
  const body = hasFraction ? `${grouped}.${fraction}` : grouped;
  return negative ? `-${body}` : body;
};

const formatWithIntl = (amount: number, currency: string): string | null => {
  if (typeof Intl === 'undefined' || typeof Intl.NumberFormat !== 'function') return null;
  try {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return null;
  }
};

export const hasValidPrice = (amount: number): boolean => Number.isFinite(amount) && amount > 0;

export const formatCurrency = (amount: number, currency: string): string => {
  if (!hasValidPrice(amount)) return '—';

  const code = currency?.toUpperCase?.() ?? '';
  if (!code) return formatAmount(amount);

  const viaIntl = formatWithIntl(amount, code);
  if (viaIntl) return viaIntl;

  const meta = metaFor(code);
  const body = formatAmount(amount);
  const joined = `${meta.symbol}${meta.separator}${body}`;
  return meta.position === 'suffix' ? `${body}${meta.separator}${meta.symbol}` : joined;
};

export const formatDiscountPercent = (price: number, compareAtPrice: number): number => {
  if (compareAtPrice <= 0 || compareAtPrice <= price) {
    return 0;
  }
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};
