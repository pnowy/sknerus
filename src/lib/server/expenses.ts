import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { expenseSchema } from '@/lib/schemas'
import type { Expense } from '../types/expense'
import { readExpenses, writeExpenses } from './storage'

export const getExpenses = createServerFn({ method: 'GET' }).handler(async () => readExpenses())

export const createExpense = createServerFn({ method: 'POST' })
  .inputValidator(expenseSchema)
  .handler(async ({ data }) => {
    const expenses = readExpenses()
    const newExpense: Expense = { ...data, id: crypto.randomUUID() }
    writeExpenses([...expenses, newExpense])
    return newExpense
  })

export const updateExpense = createServerFn({ method: 'POST' })
  .inputValidator(expenseSchema.extend({ id: z.string() }))
  .handler(async ({ data }) => {
    const expenses = readExpenses()
    const idx = expenses.findIndex((e) => e.id === data.id)
    if (idx === -1) throw new Error('Expense not found')
    expenses[idx] = data
    writeExpenses(expenses)
    return data
  })

export const deleteExpense = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    writeExpenses(readExpenses().filter((e) => e.id !== data.id))
    return { success: true }
  })
