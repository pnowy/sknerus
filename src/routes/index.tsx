import { createFileRoute, useNavigate, useRouterState } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CashflowCards } from '@/components/dashboard/cashflow-cards'
import { CategoryTrends } from '@/components/dashboard/category-trends'
import { ExpenseChart } from '@/components/dashboard/expense-chart'
import { IncomeExpensesChart } from '@/components/dashboard/income-expenses-chart'
import { MonthlyChart } from '@/components/dashboard/monthly-chart'
import { DateRangeNav } from '@/components/date-range-nav'
import { ExpenseFormDialog } from '@/components/expense-form-dialog'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDateRange } from '@/hooks/use-date-range'
import { useConfig, useExpenses } from '@/hooks/use-expenses'
import { getConfig } from '@/lib/server/functions/config'
import { getExpenses } from '@/lib/server/functions/expenses'
import { filterExpensesByRange } from '@/lib/shared/date-utils'
import { DashboardTab } from '@/lib/shared/types/dashboard-tab'
import { RangeScope } from '@/lib/shared/types/range-scope'

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
  const [addOpen, setAddOpen] = useState(false)
  const navigate = useNavigate()
  const search = useRouterState({ select: (s) => s.location.search }) as { tab?: DashboardTab }
  const activeTab = search.tab ?? DashboardTab.Breakdown

  const categories = config?.categories ?? []
  const currency = config?.currency ?? 'USD'
  const startDate = config?.startDate ?? 1

  const { scope, from, to, label, setScope, prev, next, reset, canGoNext, isCurrentPeriod, showArrows } = useDateRange(startDate)

  const allTags = useMemo(() => [...new Set(allExpenses.flatMap((e) => e.tags))].sort(), [allExpenses])
  const periodExpenses = useMemo(() => filterExpensesByRange(allExpenses, from, to), [allExpenses, from, to])
  const income = useMemo(() => periodExpenses.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0), [periodExpenses])
  const expenses = useMemo(() => periodExpenses.filter((e) => e.amount < 0).reduce((sum, e) => sum - e.amount, 0), [periodExpenses])
  const chartData = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.id, c.name]))
    const map = new Map<string, number>()
    for (const e of periodExpenses.filter((e) => e.amount < 0)) {
      map.set(e.categoryId, (map.get(e.categoryId) ?? 0) - e.amount)
    }
    return Array.from(map.entries())
      .map(([id, total]) => ({ category: catMap.get(id) ?? id, total }))
      .sort((a, b) => b.total - a.total)
  }, [periodExpenses, categories])

  function setTab(tab: string) {
    const scopeForTab = tab === DashboardTab.Breakdown ? RangeScope.Month : RangeScope.Year
    // biome-ignore lint/suspicious/noExplicitAny: search params validated by root route schema
    void navigate({ search: (prev: any) => ({ ...prev, tab, scope: scopeForTab, offset: 0 }) } as any)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-semibold text-xl">Dashboard</h1>
          <div className="flex items-center gap-3">
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              Add Expense
            </Button>
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
        <CashflowCards currency={currency} expenses={expenses} income={income} />
        <Tabs value={activeTab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value={DashboardTab.Breakdown}>Breakdown</TabsTrigger>
            <TabsTrigger value={DashboardTab.Monthly}>Monthly</TabsTrigger>
            <TabsTrigger value={DashboardTab.Trends}>Trends</TabsTrigger>
            <TabsTrigger value={DashboardTab.Balance}>Income vs Expenses</TabsTrigger>
          </TabsList>
          <TabsContent value={DashboardTab.Breakdown}>
            <ExpenseChart categories={categories} currency={currency} data={chartData} expenses={periodExpenses} />
          </TabsContent>
          <TabsContent value={DashboardTab.Monthly}>
            <MonthlyChart categories={categories} currency={currency} expenses={allExpenses} from={from} to={to} />
          </TabsContent>
          <TabsContent value={DashboardTab.Trends}>
            <CategoryTrends categories={categories} currency={currency} expenses={allExpenses} from={from} to={to} />
          </TabsContent>
          <TabsContent value={DashboardTab.Balance}>
            <IncomeExpensesChart currency={currency} expenses={allExpenses} from={from} to={to} />
          </TabsContent>
        </Tabs>
      </div>
      <ExpenseFormDialog allTags={allTags} categories={categories} currency={currency} open={addOpen} onClose={() => setAddOpen(false)} />
    </AppLayout>
  )
}
