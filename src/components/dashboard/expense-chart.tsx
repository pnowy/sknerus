import { useEffect, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/shared/format'
import type { Category } from '@/lib/shared/types/expense'
import { cn } from '@/lib/utils'

type ChartEntry = {
  category: string
  total: number
}

type Props = {
  data: Array<ChartEntry>
  currency: string
  categories: Array<Category>
}

export function ExpenseChart({ data, currency, categories }: Props) {
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  function getColor(name: string): string {
    return categories.find((c) => c.name === name)?.color ?? '#888888'
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

  function toggleCategory(category: string) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-black/20 bg-chart-paper shadow-sm md:flex-row dark:border-white/10">
      {/* Chart — rendered client-side only; ResponsiveContainer requires a real DOM to measure */}
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
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                }}
                itemStyle={{ color: '#f4f4f4' }}
                labelStyle={{ color: '#f4f4f4', fontWeight: 600 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-col justify-center gap-1 border-border border-t p-5 md:w-1/2 md:border-t-0 md:border-l">
        {data.map((entry) => {
          const isHidden = hidden.has(entry.category)
          const color = getColor(entry.category)
          const pct = allTotal > 0 ? ((entry.total / allTotal) * 100).toFixed(1) : '0.0'
          return (
            <button
              key={entry.category}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-left transition-opacity hover:bg-black/5 dark:hover:bg-white/5',
                isHidden && 'opacity-40'
              )}
              type="button"
              onClick={() => toggleCategory(entry.category)}
            >
              <span
                className="inline-block size-3.5 shrink-0 rounded-sm transition-colors"
                style={{ backgroundColor: isHidden ? '#808080' : color }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-sm">
                  {entry.category}
                  <span className="ml-1 font-normal text-muted-foreground">({pct}%)</span>
                </span>
                <span className="font-mono text-muted-foreground text-xs">{formatCurrency(entry.total, currency)}</span>
              </span>
            </button>
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
