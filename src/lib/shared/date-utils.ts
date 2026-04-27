import type { Expense } from '@/lib/shared/types/expense'

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

export function toUTC(s: string) {
  return new Date(`${s}T00:00:00Z`)
}

export function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}
