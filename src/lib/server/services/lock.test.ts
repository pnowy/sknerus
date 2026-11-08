import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createExpense } from './expenses.service'

const mocks = vi.hoisted(() => ({
  getExpenses: vi.fn(),
  saveExpenses: vi.fn(),
}))

vi.mock('@/lib/server/storage', () => ({ storage: mocks }))

let expenses: Array<Record<string, unknown>>

describe('expense writes', () => {
  beforeEach(() => {
    expenses = []
    mocks.getExpenses.mockImplementation(async () => expenses)
    mocks.saveExpenses.mockImplementation(async (nextExpenses) => {
      expenses = nextExpenses
    })
  })

  describe('when multiple expenses are created concurrently', () => {
    it('should preserve every write', async () => {
      const input = (name: string) => ({
        name,
        amount: -10,
        currency: 'PLN',
        categoryId: 'cat_food',
        date: '2026-01-05',
        tags: [],
      })

      await Promise.all([createExpense(input('Bread')), createExpense(input('Milk'))])

      expect(expenses).toHaveLength(2)
      expect(expenses.map((expense) => expense.name)).toEqual(expect.arrayContaining(['Bread', 'Milk']))
    })
  })
})
