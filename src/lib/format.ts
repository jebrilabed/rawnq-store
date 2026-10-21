export const formatPrice = (n: number, locale?: string) => {
  const amount = locale
    ? new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(n)
    : String(n);
  return `${amount} ₪`;
};
export const discountPercent = (price: number, compare?: number) =>
  compare && compare > price ? Math.round((1 - price / compare) * 100) : 0;
