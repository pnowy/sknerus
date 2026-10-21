import { describe, expect, it } from 'vitest'
import { getDefaultCategoryId, resolveIncomeForCategory } from '@/lib/shared/category-utils'
import type { Category } from '@/lib/shared/types/expense'

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
