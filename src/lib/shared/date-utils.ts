import type { Expense } from './types/expense'

export function getMonthRange(year: number, month: number, startDate: number) {
  const start = new Date(year, month, startDate)
  const end = new Date(year, month + 1, startDate)
  return { start, end }
}

export function filterExpensesByMonth(expenses: Array<Expense>, year: number, month: number, startDate: number): Array<Expense> {
  const { start, end } = getMonthRange(year, month, startDate)
  return expenses.filter((e) => {
    const d = new Date(e.date)
    return d >= start && d < end
  })
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
