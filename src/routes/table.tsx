import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DateRangeNav } from '@/components/date-range-nav'
import { ExpenseFormDialog } from '@/components/expense-form-dialog'
import { AppLayout } from '@/components/layout/app-layout'
import { EmptyState } from '@/components/table/empty-state'
import { ExpenseTable } from '@/components/table/expense-table'
import { GROUP_SORT_OPTIONS, GroupedExpenseTable, type GroupSort } from '@/components/table/grouped-expense-table'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useDateRange } from '@/hooks/use-date-range'
import { useConfig, useDeleteExpense, useExpenses } from '@/hooks/use-expenses'
import { getConfig } from '@/lib/server/functions/config'
import { getExpenses } from '@/lib/server/functions/expenses'
import { filterExpensesByRange } from '@/lib/shared/date-utils'
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
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [duplicatingExpense, setDuplicatingExpense] = useState<Expense | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [grouped, setGrouped] = useState(false)
  const [groupSort, setGroupSort] = useState<GroupSort>('config')

  const startDate = config?.startDate ?? 1
  const { scope, from, to, label, setScope, prev, next, reset, canGoNext, isCurrentPeriod, showArrows } = useDateRange(startDate)

  const displayedExpenses = useMemo(
    () => filterExpensesByRange(allExpenses, from, to).sort((a, b) => b.date.localeCompare(a.date)),
    [allExpenses, from, to]
  )

  async function handleDelete(id: string) {
    try {
      await deleteExpense.mutateAsync(id)
      toast.success('Expense deleted')
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  const tableProps = {
    categories: config?.categories ?? [],
    expenses: displayedExpenses,
    currency: config?.currency ?? 'USD',
    onEdit: setEditingExpense,
    onDuplicate: setDuplicatingExpense,
    onDelete: handleDelete,
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-semibold text-xl">Transactions</h1>
          <div className="flex items-center gap-4">
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              Add Expense
            </Button>
            <div className="flex items-center gap-2">
              <Switch checked={grouped} id="group-by-cat" onCheckedChange={setGrouped} />
              <Label htmlFor="group-by-cat" className="text-sm">
                Group
              </Label>
              {grouped && (
                <Select value={groupSort} onValueChange={(v) => v && setGroupSort(v as GroupSort)}>
                  <SelectTrigger size="sm" className="w-36">
                    <SelectValue>{(value: string) => GROUP_SORT_OPTIONS.find((o) => o.value === value)?.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <DateRangeNav
              canGoNext={canGoNext}
              isCurrentPeriod={isCurrentPeriod}
              label={label}
              scope={scope}
              showArrows={showArrows}
              onNext={next}
              onPrev={prev}
              onReset={reset}
              onScopeChange={setScope}
            />
          </div>
        </div>
        {displayedExpenses.length === 0 ? (
          <EmptyState message="No transactions for this period." />
        ) : grouped ? (
          <GroupedExpenseTable {...tableProps} groupSort={groupSort} />
        ) : (
          <ExpenseTable {...tableProps} />
        )}
      </div>
      <ExpenseFormDialog
        key={editingExpense?.id ?? duplicatingExpense?.id ?? 'add'}
        allTags={[...new Set(allExpenses.flatMap((e) => e.tags))].sort()}
        categories={config?.categories ?? []}
        currency={config?.currency ?? 'USD'}
        expense={editingExpense ?? undefined}
        template={duplicatingExpense ?? undefined}
        open={addOpen || !!editingExpense || !!duplicatingExpense}
        onClose={() => {
          setAddOpen(false)
          setEditingExpense(null)
          setDuplicatingExpense(null)
        }}
      />
    </AppLayout>
  )
}
