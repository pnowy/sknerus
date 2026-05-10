import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Switch } from '@/components/ui/switch'
import { aggregateByMonth } from '@/lib/shared/expense-utils'
import { formatCurrency, formatCurrencyCompact } from '@/lib/shared/format'
import type { Category, Expense } from '@/lib/shared/types/expense'

type Props = {
  expenses: Array<Expense>
  categories: Array<Category>
  currency: string
  from: Date
  to: Date
}

export function MonthlyChart({ expenses, categories, currency, from, to }: Props) {
  const [mounted, setMounted] = useState(false)
  const [byCategory, setByCategory] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const catMap = new Map(categories.map((c) => [c.id, c]))
  const { categoryData, activeCategories, totalData, hasTotal } = useMemo(() => {
    const ids = categories.map((c) => c.id)
    const rows = aggregateByMonth(expenses, from, to, ids)
    const active = categories.filter((c) => rows.some((r) => (r[c.id] as number) > 0))
    const totals = aggregateByMonth(expenses, from, to)
    const hasTot = totals.some((r) => (r.total as number) > 0)
    return { categoryData: rows, activeCategories: active, totalData: totals, hasTotal: hasTot }
  }, [expenses, from, to, categories])

  const hasData = byCategory ? activeCategories.length > 0 : hasTotal

  if (!hasData) {
    return <div className="flex min-h-48 items-center justify-center text-muted-foreground text-sm">No expense data for this period</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <span className="text-muted-foreground text-xs">By category</span>
        <Switch checked={byCategory} onCheckedChange={setByCategory} size="sm" />
      </div>
      <div className="h-72 md:h-[420px]">
        {mounted && (
          <ResponsiveContainer height="100%" width="100%">
            {byCategory ? (
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrencyCompact(v, currency)} width={60} />
                <Tooltip
                  formatter={(value, name) => [formatCurrency(Number(value), currency), catMap.get(String(name))?.name ?? String(name)]}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '0.8rem' }}
                  itemStyle={{ color: '#f4f4f4' }}
                  labelStyle={{ color: '#f4f4f4', fontWeight: 600 }}
                />
                <Legend formatter={(value) => catMap.get(value)?.name ?? value} />
                {activeCategories.map((c, i) => (
                  <Bar
                    key={c.id}
                    dataKey={c.id}
                    stackId="expenses"
                    fill={c.color}
                    radius={i === activeCategories.length - 1 ? [4, 4, 0, 0] : undefined}
                  />
                ))}
              </BarChart>
            ) : (
              <BarChart data={totalData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrencyCompact(v, currency)} width={60} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value), currency), 'Total']}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '0.8rem' }}
                  itemStyle={{ color: '#f4f4f4' }}
                  labelStyle={{ color: '#f4f4f4', fontWeight: 600 }}
                />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
