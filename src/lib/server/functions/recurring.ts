import { createServerFn } from '@tanstack/react-start'
import { addDays, addWeeks, format, getDay, getDaysInMonth, isAfter, isBefore, parseISO, setDate } from 'date-fns'
import { z } from 'zod'
import { recurringExpenseSchema } from '@/lib/schemas'
import { genExpenseId, genRecurringId } from '@/lib/server/ids.server'
import { storage } from '@/lib/server/storage'
import type { Expense, RecurringExpense } from '@/lib/shared/types/expense'

export const getRecurring = createServerFn({ method: 'GET' }).handler(() => storage.getRecurring())

export const createRecurring = createServerFn({ method: 'POST' })
  .inputValidator(recurringExpenseSchema.omit({ id: true }))
  .handler(async ({ data }) => {
    const recurring = await storage.getRecurring()
    const newItem: RecurringExpense = { ...data, id: genRecurringId() }
    await storage.saveRecurring([...recurring, newItem])
    return newItem
  })

export const updateRecurring = createServerFn({ method: 'POST' })
  .inputValidator(recurringExpenseSchema)
  .handler(async ({ data }) => {
    const recurring = await storage.getRecurring()
    const idx = recurring.findIndex((r) => r.id === data.id)
    if (idx === -1) throw new Error('Recurring not found')
    recurring[idx] = data
    await storage.saveRecurring(recurring)
    return data
  })

export const deleteRecurring = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const recurring = await storage.getRecurring()
    await storage.saveRecurring(recurring.filter((r) => r.id !== data.id))
    return { success: true }
  })

export const materializeRecurring = createServerFn({ method: 'POST' }).handler(async () => {
  const [recurring, expenses] = await Promise.all([storage.getRecurring(), storage.getExpenses()])
  if (recurring.length === 0) return { created: 0 }

  const today = format(new Date(), 'yyyy-MM-dd')
  const existingKeys = new Set(expenses.filter((e) => e.recurringId).map((e) => `${e.recurringId}:${e.date}`))

  const newExpenses: Array<Expense> = []
  for (const template of recurring) {
    for (const date of computeOccurrences(template, today)) {
      if (!existingKeys.has(`${template.id}:${date}`)) {
        newExpenses.push({
          id: genExpenseId(),
          name: template.name,
          amount: template.amount,
          currency: template.currency,
          categoryId: template.categoryId,
          tags: template.tags,
          date,
          recurringId: template.id,
        })
      }
    }
  }

  if (newExpenses.length > 0) {
    await storage.saveExpenses([...expenses, ...newExpenses])
  }

  return { created: newExpenses.length }
})

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
