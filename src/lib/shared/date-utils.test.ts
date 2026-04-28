import { describe, expect, it } from 'vitest'
import type { Expense } from '@/lib/shared/types/expense'
import { filterExpensesByMonth, getMonthRange } from './date-utils'

function toStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function makeExpense(date: string): Expense {
  return { id: date, name: '', amount: -1, currency: 'USD', categoryId: 'cat', date, tags: [] }
}

// month parameter is typed as Month (0 = January, 11 = December).
// It is sourced from date.getMonth() in use-month-nav.ts and passed directly to new Date(year, month, 1).

describe('getMonthRange', () => {
  describe('when the start day fits in every month', () => {
    it('should return exact day boundaries for day 1', () => {
      const { start, end } = getMonthRange(2024, 0, 1)
      expect(toStr(start)).toBe('2024-01-01')
      expect(toStr(end)).toBe('2024-02-01')
    })

    it('should return exact day boundaries for day 15', () => {
      const { start, end } = getMonthRange(2024, 2, 15)
      expect(toStr(start)).toBe('2024-03-15')
      expect(toStr(end)).toBe('2024-04-15')
    })

    it('should return exact day boundaries for day 28 even in February', () => {
      const { start, end } = getMonthRange(2023, 1, 28)
      expect(toStr(start)).toBe('2023-02-28')
      expect(toStr(end)).toBe('2023-03-28')
    })
  })

  describe('when the start day exceeds February length', () => {
    it('should clamp day 29 to Feb 28 in a non-leap year', () => {
      const { start } = getMonthRange(2023, 1, 29)
      expect(toStr(start)).toBe('2023-02-28')
    })

    it('should not clamp day 29 in a leap year', () => {
      const { start } = getMonthRange(2024, 1, 29)
      expect(toStr(start)).toBe('2024-02-29')
    })

    it('should clamp day 30 to Feb 28 in a non-leap year', () => {
      const { start } = getMonthRange(2023, 1, 30)
      expect(toStr(start)).toBe('2023-02-28')
    })

    it('should clamp day 30 to Feb 29 in a leap year', () => {
      const { start } = getMonthRange(2024, 1, 30)
      expect(toStr(start)).toBe('2024-02-29')
    })

    it('should clamp day 31 to Feb 28 in a non-leap year', () => {
      const { start } = getMonthRange(2023, 1, 31)
      expect(toStr(start)).toBe('2023-02-28')
    })

    it('should clamp day 31 to Feb 29 in a leap year', () => {
      const { start } = getMonthRange(2024, 1, 31)
      expect(toStr(start)).toBe('2024-02-29')
    })

    it('should use the correct end boundary for the next month when start is clamped', () => {
      const { start, end } = getMonthRange(2023, 1, 31)
      expect(toStr(start)).toBe('2023-02-28')
      expect(toStr(end)).toBe('2023-03-31')
    })
  })

  describe('when the start day exceeds a 30-day month', () => {
    it('should clamp day 31 to Apr 30', () => {
      const { start } = getMonthRange(2024, 3, 31)
      expect(toStr(start)).toBe('2024-04-30')
    })

    it('should clamp day 31 to Jun 30', () => {
      const { start } = getMonthRange(2024, 5, 31)
      expect(toStr(start)).toBe('2024-06-30')
    })

    it('should clamp day 31 to Nov 30', () => {
      const { start } = getMonthRange(2024, 10, 31)
      expect(toStr(start)).toBe('2024-11-30')
    })
  })

  describe('when the start day is 31 in a 31-day month', () => {
    it('should not clamp in January', () => {
      const { start } = getMonthRange(2024, 0, 31)
      expect(toStr(start)).toBe('2024-01-31')
    })

    it('should not clamp in March', () => {
      const { start } = getMonthRange(2024, 2, 31)
      expect(toStr(start)).toBe('2024-03-31')
    })

    it('should not clamp in December', () => {
      const { start } = getMonthRange(2024, 11, 31)
      expect(toStr(start)).toBe('2024-12-31')
    })
  })

  describe('when the period spans a year boundary (December → January)', () => {
    it('should set the end to January of the next year for day 1', () => {
      const { start, end } = getMonthRange(2024, 11, 1)
      expect(toStr(start)).toBe('2024-12-01')
      expect(toStr(end)).toBe('2025-01-01')
    })

    it('should set the end to Jan 31 of the next year for day 31', () => {
      const { start, end } = getMonthRange(2024, 11, 31)
      expect(toStr(start)).toBe('2024-12-31')
      expect(toStr(end)).toBe('2025-01-31')
    })

    it('should clamp Nov start to Nov 30 and end to Dec 31 for day 31', () => {
      const { start, end } = getMonthRange(2024, 10, 31)
      expect(toStr(start)).toBe('2024-11-30')
      expect(toStr(end)).toBe('2024-12-31')
    })
  })
})

describe('filterExpensesByMonth', () => {
  const expenses = [
    makeExpense('2024-01-31'),
    makeExpense('2024-02-01'),
    makeExpense('2024-02-14'),
    makeExpense('2024-02-28'),
    makeExpense('2024-02-29'),
    makeExpense('2024-03-01'),
    makeExpense('2024-03-30'),
    makeExpense('2024-03-31'),
    makeExpense('2024-04-01'),
  ]

  describe('when the fiscal start day is 1 (standard calendar month)', () => {
    it('should include expenses from the 1st up to but not including the next month', () => {
      const result = filterExpensesByMonth(expenses, 2024, 1, 1)
      expect(result.map((e) => e.date)).toEqual(['2024-02-01', '2024-02-14', '2024-02-28', '2024-02-29'])
    })

    it('should exclude an expense on the first day of the following period', () => {
      const result = filterExpensesByMonth(expenses, 2024, 2, 1)
      expect(result.map((e) => e.date)).toEqual(['2024-03-01', '2024-03-30', '2024-03-31'])
    })
  })

  describe('when the fiscal start day is 15 (mid-month)', () => {
    const e15 = [
      makeExpense('2024-02-14'),
      makeExpense('2024-02-15'),
      makeExpense('2024-02-29'),
      makeExpense('2024-03-14'),
      makeExpense('2024-03-15'),
      makeExpense('2024-03-16'),
    ]

    it('should include expenses from Feb 15 through Mar 14', () => {
      const result = filterExpensesByMonth(e15, 2024, 1, 15)
      expect(result.map((e) => e.date)).toEqual(['2024-02-15', '2024-02-29', '2024-03-14'])
    })

    it('should place Feb 14 in the January period (Jan 15 – Feb 14)', () => {
      const result = filterExpensesByMonth(e15, 2024, 0, 15)
      expect(result.map((e) => e.date)).toEqual(['2024-02-14'])
    })
  })

  describe('when the fiscal start day is 31 and months have different lengths', () => {
    it('should start the Feb period on Feb 29 (clamped) and end on Mar 31 in a leap year', () => {
      const result = filterExpensesByMonth(expenses, 2024, 1, 31)
      expect(result.map((e) => e.date)).toEqual(['2024-02-29', '2024-03-01', '2024-03-30'])
    })

    it('should start the Jan period on Jan 31 and end before Feb 29 (clamped) in a leap year', () => {
      const result = filterExpensesByMonth(expenses, 2024, 0, 31)
      expect(result.map((e) => e.date)).toEqual(['2024-01-31', '2024-02-01', '2024-02-14', '2024-02-28'])
    })

    it('should start the Mar period on Mar 31 and end before Apr 30 (clamped)', () => {
      const result = filterExpensesByMonth(expenses, 2024, 2, 31)
      expect(result.map((e) => e.date)).toEqual(['2024-03-31', '2024-04-01'])
    })
  })
})
