import type { Category } from '@/lib/shared/types/expense'

export function isCategoryOfType(category: Category, isIncome: boolean): boolean {
  return !!category.isIncome === isIncome
}

/**
 * Returns categories matching the given type (income/expense).
 * Falls back to all categories when none match, and always keeps the currently selected category visible.
 */
export function getCategoriesForType(categories: Array<Category>, isIncome: boolean, selectedId?: string): Array<Category> {
  const matching = categories.filter((c) => isCategoryOfType(c, isIncome))
  if (matching.length === 0) return categories
  return categories.filter((c) => isCategoryOfType(c, isIncome) || c.id === selectedId)
}

/**
 * Returns the category id to use after switching type, or undefined when the current one should be kept.
 */
export function resolveCategoryForType(categories: Array<Category>, isIncome: boolean, currentId: string): string | undefined {
  const current = categories.find((c) => c.id === currentId)
  if (current && isCategoryOfType(current, isIncome)) return undefined
  return categories.find((c) => isCategoryOfType(c, isIncome))?.id
}

export function getDefaultCategoryId(categories: Array<Category>): string {
  return (categories.find((c) => isCategoryOfType(c, false)) ?? categories[0])?.id ?? ''
}
