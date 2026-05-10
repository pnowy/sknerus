import { useEffect, useMemo, useState } from 'react'
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { aggregateIncomeExpenses } from '@/lib/shared/expense-utils'
import { formatCurrency, formatCurrencyCompact } from '@/lib/shared/format'
import type { Expense } from '@/lib/shared/types/expense'

type Props = {
  expenses: Array<Expense>
  currency: string
  from: Date
  to: Date
}

export function IncomeExpensesChart({ expenses, currency, from, to }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const data = useMemo(() => {
    const monthly = aggregateIncomeExpenses(expenses, from, to)
    let cumulative = 0
    return monthly.map((d) => {
      cumulative += d.income - d.expenses
      return { ...d, balance: cumulative }
    })
  }, [expenses, from, to])
  const hasData = data.some((d) => d.income > 0 || d.expenses > 0)

  if (!hasData) {
    return <div className="flex min-h-48 items-center justify-center text-muted-foreground text-sm">No data for this period</div>
  }

  const labelMap: Record<string, string> = { income: 'Income', expenses: 'Expenses', balance: 'Cumulative Balance' }

  return (
    <div className="h-72 md:h-[420px]">
      {mounted && (
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrencyCompact(v, currency)} width={60} />
            <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
            <Tooltip
              formatter={(value, name) => [formatCurrency(Number(value), currency), labelMap[String(name)] ?? String(name)]}
              contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '0.8rem' }}
              itemStyle={{ color: '#f4f4f4' }}
              labelStyle={{ color: '#f4f4f4', fontWeight: 600 }}
            />
            <Legend formatter={(value) => labelMap[value] ?? value} />
            <Bar dataKey="income" fill="#34d399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#f87171" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="balance" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
