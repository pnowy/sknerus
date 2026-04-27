import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ExpenseInput } from '@/lib/schemas'
import { getConfig, renameCategory, updateConfig } from '../lib/server/functions/config'
import { createExpense, deleteExpense, getExpenses, updateExpense } from '../lib/server/functions/expenses'
import type { Config, Expense } from '../lib/shared/types/expense'

export const queryKeys = {
  expenses: ['expenses'] as const,
  config: ['config'] as const,
}

export function useExpenses() {
  return useQuery({
    queryKey: queryKeys.expenses,
    queryFn: () => getExpenses(),
  })
}

export function useConfig() {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: () => getConfig(),
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ExpenseInput) => createExpense({ data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.expenses }),
  })
}

export function useUpdateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Expense) => updateExpense({ data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.expenses }),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteExpense({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.expenses }),
  })
}

export function useUpdateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Config) => updateConfig({ data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.config }),
  })
}

export function useRenameCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; newName: string }) => renameCategory({ data }),
    onSuccess: () =>
      Promise.all([qc.invalidateQueries({ queryKey: queryKeys.config }), qc.invalidateQueries({ queryKey: queryKeys.expenses })]),
  })
}
