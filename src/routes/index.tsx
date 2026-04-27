import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CashflowCards } from '@/components/dashboard/cashflow-cards'
import { ExpenseChart } from '@/components/dashboard/expense-chart'
import { MonthNav } from '@/components/dashboard/month-nav'
import { ExpenseFormDialog } from '@/components/expense-form-dialog'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { useConfig, useExpenses } from '@/hooks/use-expenses'
import { useMonthNav } from '@/hooks/use-month-nav'
import { getConfig } from '@/lib/server/functions/config'
import { getExpenses } from '@/lib/server/functions/expenses'
import { filterExpensesByMonth } from '@/lib/shared/date-utils'

export const Route = createFileRoute('/')({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData({ queryKey: ['expenses'], queryFn: () => getExpenses() }),
      queryClient.ensureQueryData({ queryKey: ['config'], queryFn: () => getConfig() }),
    ]),
  component: DashboardPage,
})

function DashboardPage() {
  const { data: allExpenses = [] } = useExpenses()
  const { data: config } = useConfig()
  const { year, month, label, prev, next, reset, canGoNext, isCurrentMonth } = useMonthNav()
  const [addOpen, setAddOpen] = useState(false)

  const categories = config?.categories ?? []
  const currency = config?.currency ?? 'USD'
  const startDate = config?.startDate ?? 1

  const allTags = useMemo(() => [...new Set(allExpenses.flatMap((e) => e.tags))].sort(), [allExpenses])
  const monthExpenses = useMemo(() => filterExpensesByMonth(allExpenses, year, month, startDate), [allExpenses, year, month, startDate])
  const income = useMemo(() => monthExpenses.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0), [monthExpenses])
  const expenses = useMemo(() => monthExpenses.filter((e) => e.amount < 0).reduce((sum, e) => sum - e.amount, 0), [monthExpenses])
  const chartData = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.id, c.name]))
    const map = new Map<string, number>()
    for (const e of monthExpenses.filter((e) => e.amount < 0)) {
      map.set(e.categoryId, (map.get(e.categoryId) ?? 0) - e.amount)
    }
    return Array.from(map.entries())
      .map(([id, total]) => ({ category: catMap.get(id) ?? id, total }))
      .sort((a, b) => b.total - a.total)
  }, [monthExpenses, categories])

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-xl">Dashboard</h1>
          <div className="flex items-center gap-3">
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              Add Expense
            </Button>
            <MonthNav canGoNext={canGoNext} isCurrentMonth={isCurrentMonth} label={label} onNext={next} onPrev={prev} onReset={reset} />
          </div>
        </div>
        <ExpenseChart categories={categories} currency={currency} data={chartData} />
        <CashflowCards currency={currency} expenses={expenses} income={income} />
      </div>
      <ExpenseFormDialog allTags={allTags} categories={categories} currency={currency} open={addOpen} onClose={() => setAddOpen(false)} />
    </AppLayout>
  )
}
