import { describe, expect, it } from 'vitest'
import {
  aggregateByCategoryAndMonth,
  aggregateByMonth,
  aggregateIncomeExpenses,
  compareExpensesByDate,
  getEnteredAmount,
  getEnteredCurrency,
} from '@/lib/shared/expense-utils'
import type { Expense } from '@/lib/shared/types/expense'

function makeExpense(id: string, date: string): Expense {
  return { id, name: '', amount: -1, currency: 'USD', categoryId: 'cat', date, tags: [] }
}

describe('chart aggregation', () => {
  describe('when a range starts and ends mid-month', () => {
    const from = new Date(2024, 1, 10)
    const to = new Date(2024, 2, 16)
    const expenses = [
      { ...makeExpense('before', '2024-02-09'), amount: -100 },
      { ...makeExpense('start', '2024-02-10'), amount: -10 },
      { ...makeExpense('middle', '2024-02-29'), amount: -20 },
      { ...makeExpense('end', '2024-03-15'), amount: -30 },
      { ...makeExpense('after', '2024-03-16'), amount: -200 },
      { ...makeExpense('income', '2024-03-15'), amount: 50, categoryId: 'salary' },
      { ...makeExpense('income-before', '2024-02-09'), amount: 500 },
      { ...makeExpense('income-after', '2024-03-16'), amount: 500 },
    ]

    it('should aggregate only in-range spending for monthly totals', () => {
      expect(aggregateByMonth(expenses, from, to)).toEqual([
        { month: 'February', total: 30 },
        { month: 'March', total: 30 },
      ])
    })

    it('should aggregate only in-range spending for stacked category bars', () => {
      expect(aggregateByMonth(expenses, from, to, ['cat'])).toEqual([
        { month: 'February', cat: 30 },
        { month: 'March', cat: 30 },
      ])
    })

    it('should aggregate only in-range transactions for category trends', () => {
      expect(aggregateByCategoryAndMonth(expenses, ['cat', 'salary'], from, to)).toEqual([
        { month: 'February', cat: 30, salary: 0 },
        { month: 'March', cat: 30, salary: 50 },
      ])
    })

    it('should aggregate only in-range income and expenses for the balance chart', () => {
      expect(aggregateIncomeExpenses(expenses, from, to)).toEqual([
        { month: 'February', income: 0, expenses: 30 },
        { month: 'March', income: 50, expenses: 30 },
      ])
    })
  })

  describe('when a range covers a single day', () => {
    it('should show that day in every chart instead of omitting the month', () => {
      const expenses = [makeExpense('before', '2024-02-09'), makeExpense('inside', '2024-02-10'), makeExpense('after', '2024-02-11')]
      const from = new Date(2024, 1, 10)
      const to = new Date(2024, 1, 11)
      expect(aggregateByMonth(expenses, from, to)).toEqual([{ month: 'February', total: 1 }])
      expect(aggregateByCategoryAndMonth(expenses, ['cat'], from, to)).toEqual([{ month: 'February', cat: 1 }])
      expect(aggregateIncomeExpenses(expenses, from, to)).toEqual([{ month: 'February', income: 0, expenses: 1 }])
    })
  })
})

describe('compareExpensesByDate', () => {
  describe('when the dates differ', () => {
    it('should order by date ascending regardless of id', () => {
      // later date but earlier id — date must dominate
      const earlier = makeExpense('exp_ZZZZ', '2026-01-01')
      const later = makeExpense('exp_AAAA', '2026-01-02')
      expect(compareExpensesByDate(earlier, later)).toBeLessThan(0)
      expect(compareExpensesByDate(later, earlier)).toBeGreaterThan(0)
    })
  })

  describe('when the dates are equal', () => {
    it('should break the tie by id (creation order via ULID)', () => {
      const first = makeExpense('exp_01AAAA', '2026-01-01')
      const second = makeExpense('exp_01BBBB', '2026-01-01')
      expect(compareExpensesByDate(first, second)).toBeLessThan(0)
      expect(compareExpensesByDate(second, first)).toBeGreaterThan(0)
    })

    it('should return 0 for the same expense', () => {
      const e = makeExpense('exp_01AAAA', '2026-01-01')
      expect(compareExpensesByDate(e, e)).toBe(0)
    })

    it('should produce a stable ascending sort of same-day expenses', () => {
      const a = makeExpense('exp_01AAAA', '2026-01-01')
      const b = makeExpense('exp_01BBBB', '2026-01-01')
      const c = makeExpense('exp_01CCCC', '2026-01-01')
      const sorted = [c, a, b].sort(compareExpensesByDate)
      expect(sorted.map((e) => e.id)).toEqual(['exp_01AAAA', 'exp_01BBBB', 'exp_01CCCC'])
    })
  })

  describe('when negated for descending order', () => {
    it('should place the newest date first and newest id first within a day', () => {
      const oldDay = makeExpense('exp_01ZZZZ', '2026-01-01')
      const newDayFirst = makeExpense('exp_01AAAA', '2026-01-02')
      const newDaySecond = makeExpense('exp_01BBBB', '2026-01-02')
      const sorted = [oldDay, newDayFirst, newDaySecond].sort((x, y) => -compareExpensesByDate(x, y))
      expect(sorted.map((e) => e.id)).toEqual(['exp_01BBBB', 'exp_01AAAA', 'exp_01ZZZZ'])
    })
  })
})

describe('getEnteredAmount', () => {
  describe('when the expense was recorded in the base currency', () => {
    it('should return the stored amount', () => {
      const expense: Expense = { ...makeExpense('exp_01AAAA', '2026-01-01'), amount: -100, currency: 'PLN' }
      expect(getEnteredAmount(expense)).toBe(-100)
    })
  })

  describe('when the expense was converted from a foreign currency', () => {
    it('should return the original amount instead of the converted one', () => {
      const expense: Expense = {
        ...makeExpense('exp_01AAAA', '2026-01-01'),
        amount: -364,
        currency: 'PLN',
        originalAmount: -100,
        originalCurrency: 'USD',
      }
      expect(getEnteredAmount(expense)).toBe(-100)
    })
  })

  describe('when the original currency is present but the original amount is missing', () => {
    it('should fall back to the stored amount', () => {
      const expense: Expense = {
        ...makeExpense('exp_01AAAA', '2026-01-01'),
        amount: -364,
        currency: 'PLN',
        originalCurrency: 'USD',
      }
      expect(getEnteredAmount(expense)).toBe(-364)
    })
  })

  describe('when the original amount is zero', () => {
    it('should return zero rather than falling back to the converted amount', () => {
      const expense: Expense = {
        ...makeExpense('exp_01AAAA', '2026-01-01'),
        amount: -364,
        currency: 'PLN',
        originalAmount: 0,
        originalCurrency: 'USD',
      }
      expect(getEnteredAmount(expense)).toBe(0)
    })
  })
})

describe('getEnteredCurrency', () => {
  describe('when the expense has no original currency', () => {
    it('should return the stored currency', () => {
      expect(getEnteredCurrency({ currency: 'PLN' })).toBe('PLN')
    })
  })

  describe('when the expense was converted from a foreign currency', () => {
    it('should return the original currency', () => {
      expect(getEnteredCurrency({ currency: 'PLN', originalCurrency: 'USD' })).toBe('USD')
    })
  })
})
