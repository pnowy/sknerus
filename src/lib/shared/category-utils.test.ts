import { describe, expect, it } from 'vitest'
import { getCategoryUsage, getDefaultCategoryId, getSelectableCategories, resolveIncomeForCategory } from '@/lib/shared/category-utils'
import type { Category, Expense, RecurringExpense } from '@/lib/shared/types/expense'

const salary: Category = { id: 'salary', name: 'Salary', color: '#000', isIncome: true }
const groceries: Category = { id: 'groceries', name: 'Groceries', color: '#000' }
const electricity: Category = { id: 'electricity', name: 'Electricity', color: '#000', isIncome: false }
const categories = [groceries, salary, electricity]

describe('resolveIncomeForCategory', () => {
  it('turns income on when picking an income category', () => {
    expect(resolveIncomeForCategory(categories, 'groceries', 'salary', false)).toBe(true)
  })

  it('turns income off when leaving an income category for a regular one', () => {
    expect(resolveIncomeForCategory(categories, 'salary', 'groceries', true)).toBe(false)
  })

  it('keeps a manually set value when switching between regular categories', () => {
    expect(resolveIncomeForCategory(categories, 'groceries', 'electricity', true)).toBe(true)
    expect(resolveIncomeForCategory(categories, 'electricity', 'groceries', false)).toBe(false)
  })

  it('keeps the current value for unknown categories', () => {
    expect(resolveIncomeForCategory(categories, undefined, 'missing', true)).toBe(true)
  })
})

describe('getDefaultCategoryId', () => {
  it('prefers the first expense category', () => {
    expect(getDefaultCategoryId([salary, groceries])).toBe('groceries')
  })

  it('falls back to the first category or empty string', () => {
    expect(getDefaultCategoryId([salary])).toBe('salary')
    expect(getDefaultCategoryId([])).toBe('')
  })
})

describe('getSelectableCategories', () => {
  const archived: Category = { id: 'old', name: 'Old', color: '#000', archived: true }

  describe('when a category is archived', () => {
    it('should hide it from the picker', () => {
      expect(getSelectableCategories([groceries, archived])).toEqual([groceries])
    })

    it('should keep it when it is the current selection', () => {
      expect(getSelectableCategories([groceries, archived], 'old')).toEqual([groceries, archived])
    })
  })

  describe('when choosing the default category', () => {
    it('should skip archived categories', () => {
      expect(getDefaultCategoryId([{ ...groceries, archived: true }, electricity])).toBe('electricity')
    })
  })
})

describe('getCategoryUsage', () => {
  const expense = (id: string, date: string, amount: number, categoryId = 'groceries'): Expense => ({
    id,
    name: id,
    amount,
    currency: 'PLN',
    categoryId,
    date,
    tags: [],
  })
  const recurring = (id: string, endDate?: string): RecurringExpense => ({
    id,
    name: id,
    amount: -10,
    currency: 'PLN',
    categoryId: 'groceries',
    tags: [],
    frequency: 'monthly',
    startDate: '2025-01-01',
    endDate,
  })

  describe('when the category has transactions', () => {
    const usage = getCategoryUsage(
      'groceries',
      [expense('b', '2026-03-01', -20), expense('a', '2025-01-10', -5), expense('x', '2026-05-01', -99, 'salary')],
      [recurring('running'), recurring('ended', '2026-01-01'), { ...recurring('other'), categoryId: 'salary' }],
      [],
      '2026-06-01'
    )

    it('should count only transactions in that category', () => {
      expect(usage.transactionCount).toBe(2)
      expect(usage.total).toBe(-25)
    })

    it('should report the first and the latest transaction by date', () => {
      expect(usage.firstTransaction?.id).toBe('a')
      expect(usage.lastTransaction?.id).toBe('b')
    })

    it('should list only recurring templates that have not ended', () => {
      expect(usage.activeRecurring.map((r) => r.id)).toEqual(['running'])
    })
  })

  describe('when the category is unused', () => {
    it('should report no transactions', () => {
      const usage = getCategoryUsage('groceries', [])
      expect(usage.transactionCount).toBe(0)
      expect(usage.lastTransaction).toBeUndefined()
    })
  })
})
