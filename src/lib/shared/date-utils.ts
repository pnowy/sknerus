import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  format,
  getDay,
  getDaysInMonth,
  isAfter,
  isBefore,
  parseISO,
  setDate,
} from 'date-fns'
import type { Expense, RecurringExpense } from '@/lib/shared/types/expense'
import { RangeScope } from '@/lib/shared/types/range-scope'

export type Month = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

export function getMonthRange(year: number, month: Month, fiscalStartDay: number) {
  const startMonth = new Date(year, month, 1)
  const endMonth = addMonths(startMonth, 1)
  const start = setDate(startMonth, Math.min(fiscalStartDay, getDaysInMonth(startMonth)))
  const end = setDate(endMonth, Math.min(fiscalStartDay, getDaysInMonth(endMonth)))
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

export function daysUntil(isoDate: string): number {
  return differenceInCalendarDays(parseISO(isoDate), new Date())
}

export function computeDateRange(scope: RangeScope, offset: number, fiscalStartDay: number): { from: Date; to: Date } {
  const now = new Date()
  const thisYear = now.getFullYear()

  if (scope === RangeScope.Month) {
    const target = addMonths(new Date(thisYear, now.getMonth(), 1), offset)
    const { start: from, end: to } = getMonthRange(target.getFullYear(), target.getMonth() as Month, fiscalStartDay)
    return { from, to }
  }

  if (scope === RangeScope.Quarter) {
    const currentQ = Math.floor(now.getMonth() / 3)
    const totalQ = currentQ + offset
    const targetYear = thisYear + Math.floor(totalQ / 4)
    const targetQ = ((totalQ % 4) + 4) % 4
    const qStartMonth = targetQ * 3
    const { start: from } = getMonthRange(targetYear, qStartMonth as Month, fiscalStartDay)
    const nextQMonth = qStartMonth + 3
    const endYear = nextQMonth > 11 ? targetYear + 1 : targetYear
    const endMonth = (nextQMonth % 12) as Month
    const { start: to } = getMonthRange(endYear, endMonth, fiscalStartDay)
    return { from, to }
  }

  if (scope === RangeScope.Year) {
    const targetYear = thisYear + offset
    const { start: from } = getMonthRange(targetYear, 0, fiscalStartDay)
    const { start: to } = getMonthRange(targetYear + 1, 0, fiscalStartDay)
    return { from, to }
  }

  if (scope === RangeScope.LastYear) {
    const { start: from } = getMonthRange(thisYear - 1, 0, fiscalStartDay)
    const { start: to } = getMonthRange(thisYear, 0, fiscalStartDay)
    return { from, to }
  }

  if (scope === RangeScope.ThreeYears) {
    const { start: from } = getMonthRange(thisYear - 2, 0, fiscalStartDay)
    const { start: to } = getMonthRange(thisYear + 1, 0, fiscalStartDay)
    return { from, to }
  }

  if (scope === RangeScope.FiveYears) {
    const { start: from } = getMonthRange(thisYear - 4, 0, fiscalStartDay)
    const { start: to } = getMonthRange(thisYear + 1, 0, fiscalStartDay)
    return { from, to }
  }

  if (scope === RangeScope.All) {
    return { from: new Date(2000, 0, 1), to: new Date(thisYear + 1, 11, 31) }
  }

  // ytd
  const { start: from } = getMonthRange(thisYear, 0, fiscalStartDay)
  const to = new Date(thisYear, now.getMonth(), now.getDate() + 1)
  return { from, to }
}

export function filterExpensesByRange(expenses: Array<Expense>, from: Date, to: Date): Array<Expense> {
  return expenses.filter((e) => {
    const d = parseISO(e.date)
    return d >= from && d < to
  })
}

export function formatRangeLabel(scope: RangeScope, offset: number): string {
  const now = new Date()
  const thisYear = now.getFullYear()

  if (scope === RangeScope.Month) {
    const target = addMonths(now, offset)
    return format(target, 'MMMM yyyy')
  }

  if (scope === RangeScope.Quarter) {
    const currentQ = Math.floor(now.getMonth() / 3)
    const totalQ = currentQ + offset
    const year = thisYear + Math.floor(totalQ / 4)
    const q = ((totalQ % 4) + 4) % 4
    return `Q${q + 1} ${year}`
  }

  if (scope === RangeScope.Year) return String(thisYear + offset)
  if (scope === RangeScope.LastYear) return String(thisYear - 1)
  if (scope === RangeScope.ThreeYears) return `${thisYear - 2}–${thisYear}`
  if (scope === RangeScope.FiveYears) return `${thisYear - 4}–${thisYear}`
  if (scope === RangeScope.All) return 'All Time'
  return 'Year to Date'
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

export function generateMonthBuckets(from: Date, to: Date): Array<{ label: string; year: number; month: number }> {
  const singleYear = from.getFullYear() === to.getFullYear()
  const fmt = singleYear ? 'MMMM' : 'MMM yyyy'
  const buckets: Array<{ label: string; year: number; month: number }> = []
  let cur = new Date(from.getFullYear(), from.getMonth(), 1)
  const end = new Date(to.getFullYear(), to.getMonth(), 1)
  while (cur < end) {
    buckets.push({ label: format(cur, fmt), year: cur.getFullYear(), month: cur.getMonth() })
    cur = addMonths(cur, 1)
  }
  return buckets
}
