/** رسوم الشحن: مجاناً فوق حد معيّن إن كان محدداً في الإعدادات. تُستخدم على الخادم وفي الواجهة. */
export const shippingFor = (subtotal: number, fee: number, freeFrom?: number | null) =>
  freeFrom && subtotal >= freeFrom ? 0 : fee;
