import type { ExpenseInput } from '@/lib/schemas'
import { genExpenseId } from '@/lib/server/ids.server'
import { NotFoundError } from '@/lib/server/services/errors'
import { withWriteLock } from '@/lib/server/services/lock'
import { storage } from '@/lib/server/storage'
import type { Expense } from '@/lib/shared/types/expense'

export type ExpenseFilters = {
  from?: string
  to?: string
  categoryId?: string
  tag?: string
}

export async function listExpenses(filters: ExpenseFilters = {}): Promise<Array<Expense>> {
  const expenses = await storage.getExpenses()
  return expenses.filter((expense) => {
    if (filters.from && expense.date < filters.from) return false
    if (filters.to && expense.date > filters.to) return false
    if (filters.categoryId && expense.categoryId !== filters.categoryId) return false
    if (filters.tag && !expense.tags.includes(filters.tag)) return false
    return true
  })
}

export async function getExpense(id: string): Promise<Expense> {
  const expenses = await storage.getExpenses()
  const expense = expenses.find((item) => item.id === id)
  if (!expense) throw new NotFoundError('Expense not found')
  return expense
}

export function createExpense(data: ExpenseInput): Promise<Expense> {
  return withWriteLock(async () => {
    const expenses = await storage.getExpenses()
    const newExpense: Expense = { ...data, id: genExpenseId() }
    await storage.saveExpenses([...expenses, newExpense])
    return newExpense
  })
}

export function updateExpense(data: ExpenseInput & { id: string }): Promise<Expense> {
  return withWriteLock(async () => {
    const expenses = await storage.getExpenses()
    const idx = expenses.findIndex((expense) => expense.id === data.id)
    if (idx === -1) throw new NotFoundError('Expense not found')
    return saveExpenseUpdate(expenses, idx, data)
  })
}

export function updateExpenseUsing(id: string, resolveData: (current: Expense) => Promise<ExpenseInput>): Promise<Expense> {
  return withWriteLock(async () => {
    const expenses = await storage.getExpenses()
    const idx = expenses.findIndex((expense) => expense.id === id)
    if (idx === -1) throw new NotFoundError('Expense not found')
    const data = await resolveData(expenses[idx])
    return saveExpenseUpdate(expenses, idx, { ...data, id })
  })
}

async function saveExpenseUpdate(expenses: Array<Expense>, idx: number, data: ExpenseInput & { id: string }): Promise<Expense> {
  const updated: Expense = {
    ...expenses[idx],
    ...data,
    notes: data.notes,
    originalAmount: data.originalAmount,
    originalCurrency: data.originalCurrency,
    vehicleExpense: data.vehicleExpense,
  }
  expenses[idx] = updated
  await storage.saveExpenses(expenses)
  return updated
}

export function removeExpense(id: string): Promise<boolean> {
  return withWriteLock(async () => {
    const expenses = await storage.getExpenses()
    if (!expenses.some((expense) => expense.id === id)) return false
    await storage.saveExpenses(expenses.filter((expense) => expense.id !== id))
    return true
  })
}
