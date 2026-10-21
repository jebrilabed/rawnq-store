export type Variant = { color?: string; size?: string; stock: number; price?: number };
export type Category = { slug: string; name: string };
export type Product = {
  id: string; slug: string; name: string; description: string;
  translations?: string;
  price: number; comparePrice?: number; image: string;
  categorySlug: string; stock: number; variants: Variant[]; published: boolean;
};
