import { format } from 'date-fns'
import { genExpenseId, genRecurringId } from '@/lib/server/ids.server'
import { NotFoundError } from '@/lib/server/services/errors'
import { withWriteLock } from '@/lib/server/services/lock'
import { storage } from '@/lib/server/storage'
import { computeOccurrences } from '@/lib/shared/date-utils'
import type { Expense, RecurringExpense } from '@/lib/shared/types/expense'

export async function listRecurring(): Promise<Array<RecurringExpense>> {
  return storage.getRecurring()
}

export function createRecurring(data: Omit<RecurringExpense, 'id'>): Promise<RecurringExpense> {
  return withWriteLock(async () => {
    const recurring = await storage.getRecurring()
    const newItem: RecurringExpense = { ...data, id: genRecurringId() }
    await storage.saveRecurring([...recurring, newItem])
    return newItem
  })
}

export function updateRecurring(data: RecurringExpense): Promise<RecurringExpense> {
  return withWriteLock(async () => {
    const recurring = await storage.getRecurring()
    const idx = recurring.findIndex((item) => item.id === data.id)
    if (idx === -1) throw new NotFoundError('Recurring not found')
    recurring[idx] = data
    await storage.saveRecurring(recurring)
    return data
  })
}

export function removeRecurring(id: string): Promise<{ success: true }> {
  return withWriteLock(async () => {
    const recurring = await storage.getRecurring()
    await storage.saveRecurring(recurring.filter((item) => item.id !== id))
    return { success: true }
  })
}

export function materializeRecurringExpenses(): Promise<{ created: number }> {
  return withWriteLock(async () => {
    const [recurring, expenses] = await Promise.all([storage.getRecurring(), storage.getExpenses()])
    if (recurring.length === 0) return { created: 0 }

    const today = format(new Date(), 'yyyy-MM-dd')
    const existingKeys = new Set(
      expenses.filter((expense) => expense.recurringId).map((expense) => `${expense.recurringId}:${expense.date}`)
    )

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
    if (newExpenses.length > 0) await storage.saveExpenses([...expenses, ...newExpenses])
    return { created: newExpenses.length }
  })
}
