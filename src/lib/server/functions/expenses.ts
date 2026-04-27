import { createServerFn } from '@tanstack/react-start'
import { expenseSchema } from 'src/lib/schemas'
import { z } from 'zod'
import { genExpenseId } from '@/lib/server/ids.server'
import { storage } from '@/lib/server/storage'
import type { Expense } from '@/lib/shared/types/expense'

export const getExpenses = createServerFn({ method: 'GET' }).handler(() => storage.getExpenses())

export const createExpense = createServerFn({ method: 'POST' })
  .inputValidator(expenseSchema)
  .handler(async ({ data }) => {
    const expenses = await storage.getExpenses()
    const newExpense: Expense = { ...data, id: genExpenseId() }
    await storage.saveExpenses([...expenses, newExpense])
    return newExpense
  })

export const updateExpense = createServerFn({ method: 'POST' })
  .inputValidator(expenseSchema.extend({ id: z.string() }))
  .handler(async ({ data }) => {
    const expenses = await storage.getExpenses()
    const idx = expenses.findIndex((e) => e.id === data.id)
    if (idx === -1) throw new Error('Expense not found')
    expenses[idx] = data
    await storage.saveExpenses(expenses)
    return data
  })

export const deleteExpense = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const expenses = await storage.getExpenses()
    await storage.saveExpenses(expenses.filter((e) => e.id !== data.id))
    return { success: true }
  })
