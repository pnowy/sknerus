import { addDays, addMonths, addWeeks, format, getDay, getDaysInMonth, isAfter, isBefore, parseISO, setDate } from 'date-fns'
import type { Expense, RecurringExpense } from '@/lib/shared/types/expense'

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

export function computeOccurrences(template: RecurringExpense, todayStr: string): Array<string> {
  const start = parseISO(template.startDate)
  const today = parseISO(todayStr)
  const endRaw = template.endDate ? parseISO(template.endDate) : today
  const upper = isBefore(endRaw, today) ? endRaw : today

  const dates: Array<string> = []

  if (template.frequency === 'daily') {
    let cur = start
    while (!isAfter(cur, upper)) {
      dates.push(format(cur, 'yyyy-MM-dd'))
      cur = addDays(cur, 1)
    }
  } else if (template.frequency === 'weekly') {
    const target = template.dayOfWeek ?? getDay(start)
    let cur = start
    while (getDay(cur) !== target) cur = addDays(cur, 1)
    while (!isAfter(cur, upper)) {
      dates.push(format(cur, 'yyyy-MM-dd'))
      cur = addWeeks(cur, 1)
    }
  } else if (template.frequency === 'monthly') {
    const targetDay = template.dayOfMonth ?? start.getDate()
    let year = start.getFullYear()
    let mo = start.getMonth()
    const endYear = upper.getFullYear()
    const endMo = upper.getMonth()
    while (year < endYear || (year === endYear && mo <= endMo)) {
      const monthFirst = new Date(year, mo, 1)
      const occurrence = setDate(monthFirst, Math.min(targetDay, getDaysInMonth(monthFirst)))
      if (!isBefore(occurrence, start) && !isAfter(occurrence, upper)) {
        dates.push(format(occurrence, 'yyyy-MM-dd'))
      }
      mo++
      if (mo > 11) {
        mo = 0
        year++
      }
    }
  } else if (template.frequency === 'yearly') {
    const targetMonth = (template.month ?? start.getMonth() + 1) - 1
    const targetDay = template.dayOfMonth ?? start.getDate()
    for (let year = start.getFullYear(); year <= upper.getFullYear(); year++) {
      const monthFirst = new Date(year, targetMonth, 1)
      const occurrence = setDate(monthFirst, Math.min(targetDay, getDaysInMonth(monthFirst)))
      if (!isBefore(occurrence, start) && !isAfter(occurrence, upper)) {
        dates.push(format(occurrence, 'yyyy-MM-dd'))
      }
    }
  }

  return dates
}
