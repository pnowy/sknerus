import { todayISO } from '@/lib/shared/date-utils'
import type { Category, Expense, RecurringExpense } from '@/lib/shared/types/expense'
import type { Subscription } from '@/lib/shared/types/subscription'

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
  const active = categories.filter((c) => !c.archived)
  return (active.find((c) => isCategoryOfType(c, false)) ?? active[0])?.id ?? ''
}

/**
 * Categories a picker should offer: every active one, plus the currently selected one even when archived,
 * so editing an old transaction doesn't silently lose its category.
 */
export function getSelectableCategories(categories: Array<Category>, selectedId?: string): Array<Category> {
  return categories.filter((c) => !c.archived || c.id === selectedId)
}

export type CategoryUsage = {
  transactionCount: number
  /** Sum of signed amounts in the base currency */
  total: number
  firstTransaction?: Expense
  lastTransaction?: Expense
  /** Recurring templates that will still generate transactions in this category */
  activeRecurring: Array<RecurringExpense>
  activeSubscriptions: Array<Subscription>
}

export function getCategoryUsage(
  categoryId: string,
  expenses: Array<Expense>,
  recurring: Array<RecurringExpense> = [],
  subscriptions: Array<Subscription> = [],
  today: string = todayISO()
): CategoryUsage {
  const inCategory = expenses.filter((e) => e.categoryId === categoryId).sort((a, b) => a.date.localeCompare(b.date))
  return {
    transactionCount: inCategory.length,
    total: inCategory.reduce((sum, e) => sum + e.amount, 0),
    firstTransaction: inCategory[0],
    lastTransaction: inCategory.at(-1),
    activeRecurring: recurring.filter((r) => r.categoryId === categoryId && (!r.endDate || r.endDate >= today)),
    activeSubscriptions: subscriptions.filter((s) => s.categoryId === categoryId && s.active),
  }
}
