import type { Category } from "./types";

export function orderCategories<T extends Category>(categories: T[]): { category: T; depth: number }[] {
  const childrenByParent = new Map<string, T[]>();
  const categorySlugs = new Set(categories.map((category) => category.slug));

  for (const category of categories) {
    if (!category.parentSlug || !categorySlugs.has(category.parentSlug)) continue;
    const siblings = childrenByParent.get(category.parentSlug) ?? [];
    siblings.push(category);
    childrenByParent.set(category.parentSlug, siblings);
  }

  const ordered: { category: T; depth: number }[] = [];
  const visited = new Set<string>();
  const append = (category: T, depth: number) => {
    if (visited.has(category.slug)) return;
    visited.add(category.slug);
    ordered.push({ category, depth });
    for (const child of childrenByParent.get(category.slug) ?? []) append(child, depth + 1);
  };

  for (const category of categories) {
    if (!category.parentSlug || !categorySlugs.has(category.parentSlug)) append(category, 0);
  }
  for (const category of categories) append(category, 0);

  return ordered;
}
