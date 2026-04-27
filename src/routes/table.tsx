import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { MonthNav } from '@/components/dashboard/month-nav'
import { ExpenseFormDialog } from '@/components/expense-form-dialog'
import { AppLayout } from '@/components/layout/app-layout'
import { EmptyState } from '@/components/table/empty-state'
import { ExpenseTable } from '@/components/table/expense-table'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useConfig, useDeleteExpense, useExpenses } from '@/hooks/use-expenses'
import { useMonthNav } from '@/hooks/use-month-nav'
import { getConfig } from '@/lib/server/functions/config'
import { getExpenses } from '@/lib/server/functions/expenses'
import { filterExpensesByMonth } from '@/lib/shared/date-utils'
import type { Expense } from '@/lib/shared/types/expense'

export const Route = createFileRoute('/table')({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData({ queryKey: ['expenses'], queryFn: () => getExpenses() }),
      queryClient.ensureQueryData({ queryKey: ['config'], queryFn: () => getConfig() }),
    ]),
  component: TablePage,
})

function TablePage() {
  const { data: allExpenses = [] } = useExpenses()
  const { data: config } = useConfig()
  const deleteExpense = useDeleteExpense()
  const { year, month, label, prev, next, reset, canGoNext, isCurrentMonth } = useMonthNav()
  const [showAll, setShowAll] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const startDate = config?.startDate ?? 1

  const displayedExpenses = useMemo(() => {
    if (showAll) return [...allExpenses].sort((a, b) => b.date.localeCompare(a.date))
    return filterExpensesByMonth(allExpenses, year, month, startDate).sort((a, b) => b.date.localeCompare(a.date))
  }, [allExpenses, showAll, year, month, startDate])

  async function handleDelete(id: string) {
    try {
      await deleteExpense.mutateAsync(id)
      toast.success('Expense deleted')
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-semibold text-xl">Transactions</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={showAll} id="show-all" onCheckedChange={setShowAll} />
              <Label htmlFor="show-all" className="text-sm">
                Show all
              </Label>
            </div>
            {!showAll && (
              <MonthNav canGoNext={canGoNext} isCurrentMonth={isCurrentMonth} label={label} onNext={next} onPrev={prev} onReset={reset} />
            )}
          </div>
        </div>
        {displayedExpenses.length === 0 ? (
          <EmptyState message={showAll ? 'No transactions yet.' : 'No transactions for this period.'} />
        ) : (
          <ExpenseTable
            categories={config?.categories ?? []}
            expenses={displayedExpenses}
            currency={config?.currency ?? 'USD'}
            onEdit={setEditingExpense}
            onDelete={handleDelete}
          />
        )}
      </div>
      <ExpenseFormDialog
        key={editingExpense?.id ?? 'add'}
        allTags={[...new Set(allExpenses.flatMap((e) => e.tags))].sort()}
        categories={config?.categories ?? []}
        currency={config?.currency ?? 'USD'}
        expense={editingExpense ?? undefined}
        open={!!editingExpense}
        onClose={() => setEditingExpense(null)}
      />
    </AppLayout>
  )
}
