import { describe, expect, it } from 'vitest'
import { getCategoriesForType, getDefaultCategoryId, resolveCategoryForType } from '@/lib/shared/category-utils'
import type { Category } from '@/lib/shared/types/expense'

const salary: Category = { id: 'salary', name: 'Salary', color: '#000', isIncome: true }
const groceries: Category = { id: 'groceries', name: 'Groceries', color: '#000' }
const housing: Category = { id: 'housing', name: 'Housing', color: '#000', isIncome: false }
const categories = [groceries, salary, housing]

describe('getCategoriesForType', () => {
  it('returns only expense categories for expenses', () => {
    expect(getCategoriesForType(categories, false)).toEqual([groceries, housing])
  })

  it('returns only income categories for income', () => {
    expect(getCategoriesForType(categories, true)).toEqual([salary])
  })

  it('falls back to all categories when none match', () => {
    expect(getCategoriesForType([groceries, housing], true)).toEqual([groceries, housing])
  })

  it('keeps the selected category visible even if it does not match', () => {
    expect(getCategoriesForType(categories, true, 'groceries')).toEqual([groceries, salary])
  })
})

describe('resolveCategoryForType', () => {
  it('keeps current category when it matches the type', () => {
    expect(resolveCategoryForType(categories, false, 'housing')).toBeUndefined()
  })

  it('switches to first matching category when current does not match', () => {
    expect(resolveCategoryForType(categories, true, 'groceries')).toBe('salary')
    expect(resolveCategoryForType(categories, false, 'salary')).toBe('groceries')
  })

  it('returns undefined when no category matches', () => {
    expect(resolveCategoryForType([groceries], true, 'groceries')).toBeUndefined()
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
