import { parseISO } from 'date-fns'
import { generateMonthBuckets } from '@/lib/shared/date-utils.ts'
import type { Category, Expense } from '@/lib/shared/types/expense'

/** IDs of categories flagged as excluded from budget totals (tracked for vehicle stats only) */
export function excludedCategoryIds(categories: Array<Category>): Set<string> {
  return new Set(categories.filter((c) => c.excludeFromBudget).map((c) => c.id))
}

/** Drops expenses belonging to budget-excluded categories; returns the input untouched when none are excluded */
export function filterBudgetExpenses(expenses: Array<Expense>, categories: Array<Category>): Array<Expense> {
  const excluded = excludedCategoryIds(categories)
  return excluded.size ? expenses.filter((e) => !excluded.has(e.categoryId)) : expenses
}

export function aggregateByMonth(
  expenses: Array<Expense>,
  from: Date,
  to: Date,
  categoryIds?: Array<string>
): Array<{ month: string; [key: string]: number | string }> {
  const buckets = generateMonthBuckets(from, to)
  return buckets.map((b) => {
    const entry: { month: string; [key: string]: number | string } = { month: b.label }
    if (categoryIds) for (const id of categoryIds) entry[id] = 0
    else entry.total = 0
    for (const e of expenses) {
      if (e.amount >= 0) continue
      const d = parseISO(e.date)
      if (d.getFullYear() !== b.year || d.getMonth() !== b.month) continue
      if (categoryIds) {
        if (categoryIds.includes(e.categoryId)) {
          entry[e.categoryId] = (entry[e.categoryId] as number) + Math.abs(e.amount)
        }
      } else {
        entry.total = (entry.total as number) + Math.abs(e.amount)
      }
    }
    return entry
  })
}

export function aggregateIncomeExpenses(
  expenses: Array<Expense>,
  from: Date,
  to: Date
): Array<{ month: string; income: number; expenses: number }> {
  const buckets = generateMonthBuckets(from, to)
  const result = buckets.map((b) => ({ month: b.label, income: 0, expenses: 0 }))
  for (const e of expenses) {
    const d = parseISO(e.date)
    const idx = buckets.findIndex((b) => b.year === d.getFullYear() && b.month === d.getMonth())
    if (idx !== -1) {
      if (e.amount > 0) result[idx].income += e.amount
      else result[idx].expenses += Math.abs(e.amount)
    }
  }
  return result
}

export function aggregateByCategoryAndMonth(
  expenses: Array<Expense>,
  categoryIds: Array<string>,
  from: Date,
  to: Date
): Array<{ month: string; [categoryId: string]: number | string }> {
  const buckets = generateMonthBuckets(from, to)
  return buckets.map((b) => {
    const entry: { month: string; [key: string]: number | string } = { month: b.label }
    for (const catId of categoryIds) entry[catId] = 0
    for (const e of expenses) {
      if (!categoryIds.includes(e.categoryId)) continue
      const d = parseISO(e.date)
      if (d.getFullYear() === b.year && d.getMonth() === b.month) {
        entry[e.categoryId] = (entry[e.categoryId] as number) + Math.abs(e.amount)
      }
    }
    return entry
  })
}
