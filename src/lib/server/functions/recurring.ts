import { createServerFn } from '@tanstack/react-start'
import { format } from 'date-fns'
import { z } from 'zod'
import { recurringExpenseSchema } from '@/lib/schemas'
import { genExpenseId, genRecurringId } from '@/lib/server/ids.server'
import { storage } from '@/lib/server/storage'
import { computeOccurrences } from '@/lib/shared/date-utils'
import type { Expense, RecurringExpense } from '@/lib/shared/types/expense'

export const getRecurring = createServerFn({ method: 'GET' }).handler(() => storage.getRecurring())

export const createRecurring = createServerFn({ method: 'POST' })
  .validator(recurringExpenseSchema.omit({ id: true }))
  .handler(async ({ data }) => {
    const recurring = await storage.getRecurring()
    const newItem: RecurringExpense = { ...data, id: genRecurringId() }
    await storage.saveRecurring([...recurring, newItem])
    return newItem
  })

export const updateRecurring = createServerFn({ method: 'POST' })
  .validator(recurringExpenseSchema)
  .handler(async ({ data }) => {
    const recurring = await storage.getRecurring()
    const idx = recurring.findIndex((r) => r.id === data.id)
    if (idx === -1) throw new Error('Recurring not found')
    recurring[idx] = data
    await storage.saveRecurring(recurring)
    return data
  })

export const deleteRecurring = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string() }))
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
          notes: template.notes,
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
