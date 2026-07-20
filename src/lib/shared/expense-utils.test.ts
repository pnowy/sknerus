import { describe, expect, it } from 'vitest'
import { excludedCategoryIds, filterBudgetExpenses } from './expense-utils'
import type { Category, Expense } from './types/expense'

function makeCategory(overrides: Partial<Category> = {}): Category {
  return { id: 'cat_1', name: 'Groceries', color: '#888888', ...overrides }
}

function makeExpense(categoryId: string, overrides: Partial<Expense> = {}): Expense {
  return {
    id: `exp_${categoryId}_${Math.random()}`,
    name: 'Test',
    amount: -100,
    currency: 'USD',
    categoryId,
    date: '2024-01-01',
    tags: [],
    ...overrides,
  }
}

describe('excludedCategoryIds', () => {
  describe('when no category is flagged', () => {
    it('should return an empty set', () => {
      const categories = [makeCategory({ id: 'cat_1' }), makeCategory({ id: 'cat_2' })]
      expect(excludedCategoryIds(categories).size).toBe(0)
    })
  })

  describe('when some categories are flagged', () => {
    it('should return only the flagged category ids', () => {
      const categories = [
        makeCategory({ id: 'cat_1' }),
        makeCategory({ id: 'cat_car', excludeFromBudget: true }),
        makeCategory({ id: 'cat_2', excludeFromBudget: false }),
      ]
      const ids = excludedCategoryIds(categories)
      expect([...ids]).toEqual(['cat_car'])
    })
  })
})

describe('filterBudgetExpenses', () => {
  describe('when no category is excluded', () => {
    it('should return the same expenses', () => {
      const categories = [makeCategory({ id: 'cat_1' })]
      const expenses = [makeExpense('cat_1'), makeExpense('cat_1')]
      expect(filterBudgetExpenses(expenses, categories)).toBe(expenses)
    })
  })

  describe('when a category is excluded from budget', () => {
    it('should drop expenses belonging to that category', () => {
      const categories = [makeCategory({ id: 'cat_1' }), makeCategory({ id: 'cat_car', excludeFromBudget: true })]
      const kept = makeExpense('cat_1')
      const dropped = makeExpense('cat_car')
      const result = filterBudgetExpenses([kept, dropped], categories)
      expect(result).toEqual([kept])
    })

    it('should keep income and expense entries alike as long as their category is not excluded', () => {
      const categories = [makeCategory({ id: 'cat_1' }), makeCategory({ id: 'cat_car', excludeFromBudget: true })]
      const income = makeExpense('cat_1', { amount: 2000 })
      const excludedIncome = makeExpense('cat_car', { amount: 500 })
      const result = filterBudgetExpenses([income, excludedIncome], categories)
      expect(result).toEqual([income])
    })
  })
})
