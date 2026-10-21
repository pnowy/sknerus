import type { Category } from '@/lib/shared/types/expense'

export function isCategoryOfType(category: Category, isIncome: boolean): boolean {
  return !!category.isIncome === isIncome
}

/**
 * Returns the "Report as income" value to use after the user picks another category.
 * The category income flag is only a preset: picking an income category turns the switch on,
 * leaving an income category for a regular one turns it off, and switching between regular
 * categories keeps the current (possibly manually set) value, so mixed categories like
 * "Electricity" can hold both income and expenses.
 */
export function resolveIncomeForCategory(
  categories: Array<Category>,
  previousId: string | undefined,
  nextId: string,
  currentIsIncome: boolean
): boolean {
  const next = categories.find((c) => c.id === nextId)
  if (next?.isIncome) return true
  const previous = categories.find((c) => c.id === previousId)
  if (previous?.isIncome) return false
  return currentIsIncome
}

export function getDefaultCategoryId(categories: Array<Category>): string {
  return (categories.find((c) => isCategoryOfType(c, false)) ?? categories[0])?.id ?? ''
}
