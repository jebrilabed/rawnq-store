# رونق (RAWNQ) — متجر + لوحة تحكم (Next.js 14)

Next.js 14 (App Router) + React 18 + TypeScript + CSS Modules + lucide-react. بدون Tailwind.

## التشغيل
```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000  (يحوّل تلقائياً إلى /ar)
npm run typecheck && npm run build
```

## الصفحات (`src/app/[locale]/(store)`)
الرئيسية · المنتجات (بحث + فلتر قسم) · قسم `categories/[slug]` · المنتج مع اللون/الحجم · السلة · إتمام الطلب (Server Action) ·
تأكيد الطلب · طلباتي · تفاصيل الطلب · تسجيل الدخول · إنشاء حساب · صفحات المحتوى `page/[slug]` (من نحن، الأسئلة الشائعة، التوصيل).

## لوحة التحكم (`/admin`)
الرئيسية · المنتجات (إضافة/تعديل/نشر/حذف + جدول اللون والحجم) · الأقسام (ديناميكية: إضافة/تسمية/حذف) · الطلبات وتفاصيلها بصور المنتجات وتغيير الحالة · المخزون · المحتوى والأسئلة الشائعة · الإعدادات (شحن، دفع، تنبيه المخزون).

**الأمان:** `requireAdmin()` في `src/lib/auth/require-admin.ts` تُستدعى في layout اللوحة وفي كل Server Action، وهي **ترفض الدخول في الإنتاج** حتى تربطها بـ Auth.js (تحقق من دور ADMIN من قاعدة البيانات). في التطوير تعمل بدون تسجيل دخول.

**البيانات:** `src/lib/data/db.ts` قاعدة بيانات تجريبية في الذاكرة تتشارك بين المتجر واللوحة (تعديل منتج/قسم/إعداد يظهر في المتجر فوراً أثناء التطوير، وتضيع عند إعادة التشغيل). استبدل `db.ts` و`admin.ts` و`catalog.ts` باستعلامات Prisma.

## ما هو تجريبي ويجب ربطه بالباك
| الملف | الحالة | المطلوب |
|---|---|---|
| `src/lib/data/catalog.ts` | بيانات ثابتة | استبدل الدوال بـ Prisma (منتجات منشورة + SKU) |
| `src/components/storefront/CartProvider.tsx` | سلة في المتصفح | سلة خادم (رمز ضيف مُجزّأ) + Server Actions |
| `.../checkout/actions.ts` | يعيد بناء الطلب من الكتالوج لكن بلا حفظ | معاملة Prisma: قفل SKU، خصم مشروط، إنشاء الطلب ولقطاته، idempotency key |
| `src/lib/orders.ts` | الطلبات في localStorage | اقرأ من قاعدة البيانات مقيّدةً بصاحب الحساب؛ للضيف رمز موقّع |
| `src/components/storefront/AuthForm.tsx` | واجهة فقط | Auth.js Credentials (signIn) + إنشاء CUSTOMER على الخادم |
| `src/lib/config.ts` | قيم أولية فقط | الشحن والدفع يُقرآن الآن من إعدادات `db.settings` |
| `src/lib/data/content.ts` | نصوص تجريبية | محتوى حقيقي |
| `public/products/*` | صور تجريبية | Cloudinary: حقل الصورة بالنموذج يقبل مسراً أو رابط https؛ اربطه برفع الباك |

## للدمج في مشروعك الحالي (apps/web)
انسخ `src/` و`public/` فوق مشروعك، وادمج `src/app/layout.tsx` مع root layout الموجود، وأضف `lucide-react` إن لم يكن موجوداً.
