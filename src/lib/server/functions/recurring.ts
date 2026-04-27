import { createServerFn } from '@tanstack/react-start'
import { recurringExpenseSchema } from 'src/lib/schemas'
import { z } from 'zod'
import { genExpenseId, genRecurringId } from '@/lib/server/ids.server'
import { storage } from '@/lib/server/storage'
import { daysInMonth, toISO, toUTC } from '@/lib/shared/date-utils.ts'
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

  const today = new Date().toISOString().slice(0, 10)
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
  const start = toUTC(template.startDate)
  const today = toUTC(todayStr)
  const endRaw = template.endDate ? toUTC(template.endDate) : today
  const upper = endRaw < today ? endRaw : today

  const dates: Array<string> = []

  if (template.frequency === 'daily') {
    const cur = new Date(start)
    while (cur <= upper) {
      dates.push(toISO(cur))
      cur.setUTCDate(cur.getUTCDate() + 1)
    }
  } else if (template.frequency === 'weekly') {
    const target = template.dayOfWeek ?? start.getUTCDay()
    const cur = new Date(start)
    while (cur.getUTCDay() !== target) cur.setUTCDate(cur.getUTCDate() + 1)
    while (cur <= upper) {
      dates.push(toISO(cur))
      cur.setUTCDate(cur.getUTCDate() + 7)
    }
  } else if (template.frequency === 'monthly') {
    const targetDay = template.dayOfMonth ?? start.getUTCDate()
    let year = start.getUTCFullYear()
    let mo = start.getUTCMonth() + 1
    const endYear = upper.getUTCFullYear()
    const endMo = upper.getUTCMonth() + 1
    while (year < endYear || (year === endYear && mo <= endMo)) {
      const day = Math.min(targetDay, daysInMonth(year, mo))
      const occurrence = new Date(Date.UTC(year, mo - 1, day))
      if (occurrence >= start && occurrence <= upper) dates.push(toISO(occurrence))
      mo++
      if (mo > 12) {
        mo = 1
        year++
      }
    }
  } else if (template.frequency === 'yearly') {
    const targetMonth = template.month ?? start.getUTCMonth() + 1
    const targetDay = template.dayOfMonth ?? start.getUTCDate()
    for (let year = start.getUTCFullYear(); year <= upper.getUTCFullYear(); year++) {
      const day = Math.min(targetDay, daysInMonth(year, targetMonth))
      const occurrence = new Date(Date.UTC(year, targetMonth - 1, day))
      if (occurrence >= start && occurrence <= upper) dates.push(toISO(occurrence))
    }
  }

  return dates
}
