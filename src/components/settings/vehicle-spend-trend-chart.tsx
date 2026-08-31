import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ensureReadableColor } from '@/lib/shared/color'
import { formatCurrency } from '@/lib/shared/format'
import type { Expense } from '@/lib/shared/types/expense'
import type { Vehicle, VehicleExpenseType } from '@/lib/shared/types/vehicle'
import { VEHICLE_EXPENSE_TYPE_LABELS } from '@/lib/shared/types/vehicle'
import { DEFAULT_EXPENSE_TYPE_COLOR } from '@/lib/shared/vehicle-icons'
import { vehicleSpendBreakdownByWeek } from '@/lib/shared/vehicle-utils'

const TOOLTIP_BG = '#1a1a1a'
const SURFACE_BG_LIGHT = '#ffffff'
const SURFACE_BG_DARK = '#0a0a0a'

type Props = {
  vehicle: Vehicle
  expenses: Array<Expense>
  currency: string
}

export function VehicleSpendTrendChart({ vehicle, expenses, currency }: Props) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  useEffect(() => {
    setMounted(true)
  }, [])

  const surfaceBg = resolvedTheme === 'dark' ? SURFACE_BG_DARK : SURFACE_BG_LIGHT

  const rows = vehicleSpendBreakdownByWeek(vehicle, expenses)
  const activeTypes = (Object.keys(VEHICLE_EXPENSE_TYPE_LABELS) as Array<VehicleExpenseType>).filter((t) =>
    rows.some((r) => (r[t] ?? 0) > 0)
  )
  const colorFor = (t: VehicleExpenseType) => vehicle.expenseTypeColors?.[t] ?? DEFAULT_EXPENSE_TYPE_COLOR[t]

  if (rows.length < 2 || activeTypes.length < 2) {
    return (
      <div className="flex min-h-48 items-center justify-center text-muted-foreground text-sm">
        Not enough data yet — log vehicle expenses of at least two different types across at least two weeks.
      </div>
    )
  }

  return (
    <div className="h-72 md:h-[420px]">
      {mounted && (
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={rows} stackOffset="expand" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v * 100)}%`} width={48} />
            <Tooltip
              content={({ active, label, payload }) => {
                if (!active || !payload || payload.length === 0) return null
                const total = payload.reduce((sum, p) => sum + (Number(p.value) || 0), 0)
                return (
                  <div className="rounded-lg px-3 py-2 text-[#f4f4f4] text-xs" style={{ backgroundColor: TOOLTIP_BG }}>
                    <p className="mb-1 font-semibold">Week ending {label}</p>
                    {payload.map((p) => {
                      const value = Number(p.value) || 0
                      const pct = total > 0 ? (value / total) * 100 : 0
                      const typeLabel = VEHICLE_EXPENSE_TYPE_LABELS[p.dataKey as VehicleExpenseType] ?? String(p.dataKey)
                      return (
                        <p key={String(p.dataKey)} style={{ color: ensureReadableColor(String(p.color ?? ''), TOOLTIP_BG) }}>
                          {typeLabel}: {pct.toFixed(1)}% · {formatCurrency(value, currency)}
                        </p>
                      )
                    })}
                    <p className="mt-1 border-white/20 border-t pt-1 font-semibold">Total: {formatCurrency(total, currency)}</p>
                  </div>
                )
              }}
            />
            <Legend
              formatter={(value, entry) => (
                <span style={{ color: ensureReadableColor(String(entry?.color ?? ''), surfaceBg, 3) }}>
                  {VEHICLE_EXPENSE_TYPE_LABELS[value as VehicleExpenseType] ?? value}
                </span>
              )}
            />
            {activeTypes.map((t, i) => (
              <Bar key={t} dataKey={t} stackId="1" fill={colorFor(t)} radius={i === activeTypes.length - 1 ? [4, 4, 0, 0] : undefined} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
