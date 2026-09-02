import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { expenseSchema } from '@/lib/schemas'
import { genExpenseId } from '@/lib/server/ids.server'
import { storage } from '@/lib/server/storage'
import type { Expense } from '@/lib/shared/types/expense'

export const getExpenses = createServerFn({ method: 'GET' }).handler(() => storage.getExpenses())

export const createExpense = createServerFn({ method: 'POST' })
  .validator(expenseSchema)
  .handler(async ({ data }) => {
    const expenses = await storage.getExpenses()
    const newExpense: Expense = { ...data, id: genExpenseId() }
    await storage.saveExpenses([...expenses, newExpense])
    return newExpense
  })

export const updateExpense = createServerFn({ method: 'POST' })
  .validator(expenseSchema.extend({ id: z.string() }))
  .handler(async ({ data }) => {
    const expenses = await storage.getExpenses()
    const idx = expenses.findIndex((e) => e.id === data.id)
    if (idx === -1) throw new Error('Expense not found')
    // Optional fields are dropped from the serialized payload when unset, so they
    // must be reassigned explicitly — a plain spread would keep stale values
    // (e.g. originalAmount/originalCurrency after switching back to the base currency).
    expenses[idx] = {
      ...expenses[idx],
      ...data,
      notes: data.notes,
      originalAmount: data.originalAmount,
      originalCurrency: data.originalCurrency,
      vehicleExpense: data.vehicleExpense,
    }
    await storage.saveExpenses(expenses)
    return data
  })

export const deleteExpense = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const expenses = await storage.getExpenses()
    await storage.saveExpenses(expenses.filter((e) => e.id !== data.id))
    return { success: true }
  })
