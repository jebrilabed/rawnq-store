export const formatPrice = (n: number) => `${n} ₪`;
export const discountPercent = (price: number, compare?: number) =>
  compare && compare > price ? Math.round((1 - price / compare) * 100) : 0;
