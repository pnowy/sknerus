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
import { useVehicles } from '@/hooks/use-vehicles'
import { getConfig } from '@/lib/server/functions/config'
import { getExpenses } from '@/lib/server/functions/expenses'
import { getVehicles } from '@/lib/server/functions/vehicles'
import { filterExpensesByRange } from '@/lib/shared/date-utils'
import { excludedCategoryIds } from '@/lib/shared/expense-utils'
import type { Expense } from '@/lib/shared/types/expense'

export const Route = createFileRoute('/table')({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData({ queryKey: ['expenses'], queryFn: () => getExpenses() }),
      queryClient.ensureQueryData({ queryKey: ['config'], queryFn: () => getConfig() }),
      queryClient.ensureQueryData({ queryKey: ['vehicles'], queryFn: () => getVehicles() }),
    ]),
  component: TablePage,
})

function TablePage() {
  const { data: allExpenses = [] } = useExpenses()
  const { data: config } = useConfig()
  const { data: vehicles = [] } = useVehicles()
  const deleteExpense = useDeleteExpense()
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [duplicatingExpense, setDuplicatingExpense] = useState<Expense | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [grouped, setGrouped] = useState(false)
  const [groupSort, setGroupSort] = useState<GroupSort>('config')
  const [showExcluded, setShowExcluded] = useState(false)

  const startDate = config?.startDate ?? 1
  const { scope, from, to, label, setScope, prev, next, reset, canGoNext, isCurrentPeriod, showArrows } = useDateRange(startDate)

  const excludedIds = useMemo(() => excludedCategoryIds(config?.categories ?? []), [config?.categories])

  const inRange = useMemo(() => filterExpensesByRange(allExpenses, from, to), [allExpenses, from, to])
  // Only surface the reveal switch when there is actually something hidden to reveal in this period.
  const hasExcludedInRange = useMemo(
    () => excludedIds.size > 0 && inRange.some((e) => excludedIds.has(e.categoryId)),
    [inRange, excludedIds]
  )

  const displayedExpenses = useMemo(() => {
    const visible = showExcluded ? inRange : inRange.filter((e) => !excludedIds.has(e.categoryId))
    return [...visible].sort((a, b) => b.date.localeCompare(a.date))
  }, [inRange, showExcluded, excludedIds])

  async function handleDelete(id: string) {
    try {
      await deleteExpense.mutateAsync(id)
      toast.success('Expense deleted')
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  const currency = config?.currency ?? 'USD'
  const vehicleTrackingEnabled = config?.features?.vehicleExpenseTracking
  const tableProps = {
    categories: config?.categories ?? [],
    expenses: displayedExpenses,
    vehicles: vehicleTrackingEnabled ? vehicles : undefined,
    onEdit: setEditingExpense,
    onDuplicate: setDuplicatingExpense,
    onDelete: handleDelete,
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="hidden font-semibold text-xl sm:block">Transactions</h1>
          <div className="flex flex-1 flex-wrap items-center justify-center gap-4 sm:flex-none sm:justify-end">
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
            {hasExcludedInRange && (
              <div className="flex items-center gap-2">
                <Switch checked={showExcluded} id="show-excluded" onCheckedChange={setShowExcluded} />
                <Label htmlFor="show-excluded" className="text-sm">
                  Show tracking-only
                </Label>
              </div>
            )}
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
          <GroupedExpenseTable {...tableProps} currency={currency} groupSort={groupSort} />
        ) : (
          <ExpenseTable {...tableProps} />
        )}
      </div>
      <ExpenseFormDialog
        key={editingExpense?.id ?? duplicatingExpense?.id ?? 'add'}
        allTags={[...new Set(allExpenses.flatMap((e) => e.tags))].sort()}
        categories={config?.categories ?? []}
        currency={config?.currency ?? 'USD'}
        supportedCurrencies={config?.supportedCurrencies ?? []}
        expense={editingExpense ?? undefined}
        template={duplicatingExpense ?? undefined}
        vehicles={vehicleTrackingEnabled ? vehicles : undefined}
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
