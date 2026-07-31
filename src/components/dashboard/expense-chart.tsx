import { Eye, EyeOff, List } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { compareExpensesByDate } from '@/lib/shared/expense-utils'
import { formatCurrency, formatDate } from '@/lib/shared/format'
import type { Category, Expense } from '@/lib/shared/types/expense'
import { cn } from '@/lib/utils'

type ChartEntry = {
  category: string
  total: number
}

type Props = {
  data: Array<ChartEntry>
  currency: string
  categories: Array<Category>
  expenses: Array<Expense>
}

export function ExpenseChart({ data, currency, categories, expenses }: Props) {
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  function getColor(name: string): string {
    return categories.find((c) => c.name === name)?.color ?? '#888888'
  }

  function getCategoryId(name: string): string | undefined {
    return categories.find((c) => c.name === name)?.id
  }

  if (data.length === 0) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-xl border border-black/20 bg-chart-paper text-muted-foreground text-sm shadow-sm dark:border-white/10">
        No expense data for this period
      </div>
    )
  }

  const activeData = data.filter((d) => !hidden.has(d.category))
  const grandTotal = activeData.reduce((sum, d) => sum + d.total, 0)
  const allTotal = data.reduce((sum, d) => sum + d.total, 0)

  function toggleHidden(category: string) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  function toggleExpanded(category: string) {
    setExpanded((prev) => (prev === category ? null : category))
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-black/20 bg-chart-paper shadow-sm md:flex-row dark:border-white/10">
      <div className="flex h-72 items-center justify-center p-4 md:h-[420px] md:w-1/2">
        {mounted && (
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie
                cx="50%"
                cy="50%"
                data={activeData}
                dataKey="total"
                animationBegin={0}
                animationDuration={400}
                innerRadius="52%"
                nameKey="category"
                outerRadius="85%"
                stroke="#1a1a1a"
                strokeWidth={1}
              >
                {activeData.map((entry) => (
                  <Cell key={entry.category} fill={getColor(entry.category)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => {
                  const num = Number(value)
                  const pct = grandTotal > 0 ? ((num / grandTotal) * 100).toFixed(1) : '0.0'
                  return [`${formatCurrency(num, currency)} (${pct}%)`, String(name)]
                }}
                contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '0.8rem' }}
                itemStyle={{ color: '#f4f4f4' }}
                labelStyle={{ color: '#f4f4f4', fontWeight: 600 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex flex-col gap-1 border-border border-t p-5 md:w-1/2 md:border-t-0 md:border-l">
        {data.map((entry) => {
          const isHidden = hidden.has(entry.category)
          const isExpanded = expanded === entry.category
          const color = getColor(entry.category)
          const pct = allTotal > 0 ? ((entry.total / allTotal) * 100).toFixed(1) : '0.0'
          const catId = getCategoryId(entry.category)
          const catExpenses = catId
            ? expenses.filter((e) => e.categoryId === catId && e.amount < 0).sort((a, b) => -compareExpensesByDate(a, b))
            : []

          return (
            <div key={entry.category}>
              <div className={cn('flex items-center gap-2 rounded-md px-2 py-1.5 transition-opacity', isHidden && 'opacity-40')}>
                <span className="inline-block size-3.5 shrink-0 rounded-sm" style={{ backgroundColor: isHidden ? '#808080' : color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-sm">
                    {entry.category}
                    <span className="ml-1 font-normal text-muted-foreground">({pct}%)</span>
                  </span>
                  <span className="font-mono text-muted-foreground text-xs">{formatCurrency(entry.total, currency)}</span>
                </span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  title={isHidden ? 'Show on chart' : 'Hide from chart'}
                  onClick={() => toggleHidden(entry.category)}
                >
                  {isHidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
                <Button size="icon-sm" variant="ghost" title="Show transactions" onClick={() => toggleExpanded(entry.category)}>
                  <List className="size-3.5" />
                </Button>
              </div>
              {isExpanded && catExpenses.length > 0 && (
                <div className="mb-1 ml-6 max-h-40 overflow-y-auto rounded border bg-background/50 p-2">
                  {catExpenses.slice(0, 10).map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-2 py-0.5 text-xs">
                      <span className="truncate">{e.name}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {formatCurrency(Math.abs(e.amount), currency)} · {formatDate(e.date)}
                      </span>
                    </div>
                  ))}
                  {catExpenses.length > 10 && <p className="mt-1 text-muted-foreground text-xs">+{catExpenses.length - 10} more</p>}
                </div>
              )}
            </div>
          )
        })}

        {data.length > 1 && (
          <div className="mt-2 flex items-center gap-3 border-border border-t px-2 pt-2">
            <span className="size-3.5 shrink-0" />
            <span className="flex-1">
              <span className="block font-semibold text-sm">{hidden.size > 0 ? 'Visible total' : 'Total'}</span>
              <span className="font-mono text-muted-foreground text-xs">{formatCurrency(grandTotal, currency)}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
