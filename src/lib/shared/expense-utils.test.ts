import { describe, expect, it } from 'vitest'
import type { Expense } from '@/lib/shared/types/expense'
import { compareExpensesByDate, getEnteredAmount, getEnteredCurrency } from './expense-utils'

function makeExpense(id: string, date: string): Expense {
  return { id, name: '', amount: -1, currency: 'USD', categoryId: 'cat', date, tags: [] }
}

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
