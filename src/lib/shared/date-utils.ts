import { addMonths, format, getDaysInMonth, parseISO, setDate } from 'date-fns'
import type { Expense } from '@/lib/shared/types/expense'

export type Month = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

export function getMonthRange(year: number, month: Month, startDate: number) {
  const startMonth = new Date(year, month, 1)
  const endMonth = addMonths(startMonth, 1)
  const start = setDate(startMonth, Math.min(startDate, getDaysInMonth(startMonth)))
  const end = setDate(endMonth, Math.min(startDate, getDaysInMonth(endMonth)))
  return { start, end }
}

export function filterExpensesByMonth(expenses: Array<Expense>, year: number, month: Month, startDate: number): Array<Expense> {
  const { start, end } = getMonthRange(year, month, startDate)
  return expenses.filter((e) => {
    const d = parseISO(e.date)
    return d >= start && d < end
  })
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
