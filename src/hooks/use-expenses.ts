import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ExpenseInput } from '@/lib/schemas'
import { getConfig, renameCategory, updateConfig } from '@/lib/server/functions/config'
import { createExpense, deleteExpense, getExpenses, updateExpense } from '@/lib/server/functions/expenses'
import { createRecurring, deleteRecurring, getRecurring, updateRecurring } from '@/lib/server/functions/recurring'
import type { Config, Expense, RecurringExpense } from '@/lib/shared/types/expense'

export const queryKeys = {
  expenses: ['expenses'] as const,
  config: ['config'] as const,
  recurring: ['recurring'] as const,
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

export function useRecurring() {
  return useQuery({
    queryKey: queryKeys.recurring,
    queryFn: () => getRecurring(),
  })
}

export function useCreateRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<RecurringExpense, 'id'>) => createRecurring({ data }),
    onSuccess: () =>
      Promise.all([qc.invalidateQueries({ queryKey: queryKeys.recurring }), qc.invalidateQueries({ queryKey: queryKeys.expenses })]),
  })
}

export function useUpdateRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RecurringExpense) => updateRecurring({ data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.recurring }),
  })
}

export function useDeleteRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRecurring({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.recurring }),
  })
}
