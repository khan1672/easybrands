export const formatCurrency = (amount: number, currency = 'USD'): string => {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
  return `${symbol}${amount.toFixed(2)}`;
};

export const formatDiscountPercent = (price: number, compareAtPrice: number): number => {
  if (compareAtPrice <= 0 || compareAtPrice <= price) {
    return 0;
  }
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};