import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { aggregateByCategoryAndMonth } from '@/lib/shared/expense-utils'
import { formatCurrency, formatCurrencyCompact } from '@/lib/shared/format'
import type { Category, Expense } from '@/lib/shared/types/expense'

type Props = {
  expenses: Array<Expense>
  categories: Array<Category>
  currency: string
  from: Date
  to: Date
}

export function CategoryTrends({ expenses, categories, currency, from, to }: Props) {
  const [mounted, setMounted] = useState(false)
  const [selected, setSelected] = useState<Array<string>>(() => categories.slice(0, 3).map((c) => c.id))

  useEffect(() => {
    setMounted(true)
  }, [])

  const data = useMemo(() => aggregateByCategoryAndMonth(expenses, selected, from, to), [expenses, selected, from, to])
  const catMap = new Map(categories.map((c) => [c.id, c]))

  function toggleCategory(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : prev.length < 5 ? [...prev, id] : prev))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const isActive = selected.includes(c.id)
          return (
            <button
              key={c.id}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                isActive ? 'border-foreground/30 bg-foreground/10 font-medium' : 'border-border opacity-50 hover:opacity-75'
              }`}
              type="button"
              onClick={() => toggleCategory(c.id)}
            >
              <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}
            </button>
          )
        })}
      </div>
      {selected.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center text-muted-foreground text-sm">Select categories to compare</div>
      ) : (
        <div className="h-72 md:h-[380px]">
          {mounted && (
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                {selected.map((catId) => (
                  <Line
                    key={catId}
                    type="monotone"
                    dataKey={catId}
                    stroke={catMap.get(catId)?.color ?? '#888'}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  )
}
