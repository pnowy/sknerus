import { ChartColumn, ChartLine, List } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { type UnderlineTab, UnderlineTabsList } from '@/components/layout/underline-tabs-list'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { formatCurrency, formatDate } from '@/lib/shared/format'
import {
  calcPeriodCost,
  formatBillingPeriod,
  overallPriceChange,
  type PaymentHistoryRow,
  paymentHistory,
  subscriptionPayments,
  yearlyTotals,
} from '@/lib/shared/subscription-utils'
import type { Expense } from '@/lib/shared/types/expense'
import type { DeductionProfile, Subscription } from '@/lib/shared/types/subscription'
import { cn } from '@/lib/utils'

type StatsTab = 'payments' | 'yearly' | 'price'

const STATS_TABS: Array<UnderlineTab<StatsTab>> = [
  { value: 'payments', label: 'Payments', icon: List },
  { value: 'yearly', label: 'Per year', icon: ChartColumn },
  { value: 'price', label: 'Price', icon: ChartLine },
]

const TOOLTIP_BG = '#1a1a1a'
const CHART_COLOR = 'var(--primary)'

type Props = {
  subscription: Subscription
  expenses: Array<Expense>
  profile?: DeductionProfile
  /** Base currency */
  currency: string
  onClose: () => void
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-muted/50 rounded-lg px-4 py-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  )
}

function formatChange(change: number): string {
  const pct = (change * 100).toFixed(1)
  return `${change > 0 ? '+' : ''}${pct}%`
}

function ChangeBadge({ change }: { change?: number }) {
  if (change === undefined || Math.abs(change) < 0.0005) return null
  // a price increase is bad news for a cost, so it gets the destructive color
  return (
    <span className={cn('text-xs tabular-nums', change > 0 ? 'text-destructive' : 'text-green-600 dark:text-green-500')}>
      {formatChange(change)}
    </span>
  )
}

function ChartTooltip({ title, lines }: { title: string; lines: Array<string> }) {
  return (
    <div className="rounded-lg px-3 py-2 text-xs text-[#f4f4f4]" style={{ backgroundColor: TOOLTIP_BG }}>
      <p className="mb-1 font-semibold">{title}</p>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  )
}

function NotEnoughData({ children }: { children: React.ReactNode }) {
  return <div className="text-muted-foreground flex min-h-48 items-center justify-center text-center text-sm">{children}</div>
}

export function SubscriptionStatsDialog({ subscription, expenses, profile, currency, onClose }: Props) {
  const [tab, setTab] = useState<StatsTab>('payments')
  // recharts measures the DOM, so charts render only after mount
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const history = paymentHistory(subscriptionPayments(subscription, expenses))
  const newestFirst = [...history].reverse()
  const years = yearlyTotals(history)
  const totalPaid = history.reduce((sum, row) => sum + row.base, 0)
  const priceChange = overallPriceChange(history)
  const first = history[0]
  const last = history[history.length - 1]
  // deductions apply to what was actually paid, so the profile runs over the base-currency total
  const afterDeductions = profile ? calcPeriodCost({ ...subscription, amount: totalPaid }, profile, 1).effective : undefined
  const priceSeries = history.filter((row) => row.currency === last?.currency)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{subscription.name} — Stats</DialogTitle>
        </DialogHeader>

        {history.length === 0 ? (
          <NotEnoughData>
            No payments yet. Link transactions in the subscription form or book a payment when the renewal is due.
          </NotEnoughData>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatCard
                hint={`${history.length} payment${history.length === 1 ? '' : 's'} since ${formatDate(first.date)}`}
                label="Total paid"
                value={formatCurrency(totalPaid, currency)}
              />
              <StatCard
                hint={formatBillingPeriod(subscription.billingPeriodMonths)}
                label="Last payment"
                value={formatCurrency(last.price, last.currency)}
              />
              <StatCard
                hint={priceChange !== undefined ? `vs ${formatCurrency(first.price, first.currency)} at first` : undefined}
                label="Price change"
                value={priceChange !== undefined ? formatChange(priceChange) : '—'}
              />
              {afterDeductions !== undefined ? (
                <StatCard hint={profile?.name} label="After deductions" value={formatCurrency(afterDeductions, currency)} />
              ) : (
                <StatCard
                  hint={`over ${years.length} year${years.length === 1 ? '' : 's'}`}
                  label="Average per year"
                  value={formatCurrency(totalPaid / years.length, currency)}
                />
              )}
            </div>

            <Tabs className="flex min-h-0 flex-1 flex-col" value={tab} onValueChange={(value) => setTab(value as StatsTab)}>
              <UnderlineTabsList activeTab={tab} tabs={STATS_TABS} />

              <TabsContent className="-mr-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-2" value="payments">
                {newestFirst.map((row: PaymentHistoryRow) => (
                  <div key={row.id} className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
                    <p className="text-sm font-medium">{formatDate(row.date)}</p>
                    <div className="flex items-center gap-3 text-right">
                      <ChangeBadge change={row.change} />
                      <div>
                        <p className="text-sm font-medium tabular-nums">{formatCurrency(row.price, row.currency)}</p>
                        {row.currency !== currency && (
                          <p className="text-muted-foreground text-xs tabular-nums">{formatCurrency(row.base, currency)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent className="space-y-3" value="yearly">
                <p className="text-muted-foreground text-xs">Total paid per calendar year in {currency}.</p>
                <div className="h-64">
                  {mounted && (
                    <ResponsiveContainer height="100%" width="100%">
                      <BarChart data={years} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid opacity={0.3} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => Number(v).toLocaleString()} width={56} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            const entry = payload?.[0]?.payload as (typeof years)[number] | undefined
                            if (!active || !entry) return null
                            return (
                              <ChartTooltip
                                lines={[formatCurrency(entry.total, currency), `${entry.count} payment${entry.count === 1 ? '' : 's'}`]}
                                title={String(label)}
                              />
                            )
                          }}
                          cursor={{ opacity: 0.1 }}
                        />
                        <Bar dataKey="total" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </TabsContent>

              <TabsContent className="space-y-3" value="price">
                {priceSeries.length < 2 ? (
                  <NotEnoughData>At least two payments in the same currency are needed to show the price trend.</NotEnoughData>
                ) : (
                  <>
                    <p className="text-muted-foreground text-xs">Price of each payment in {last.currency}, as entered.</p>
                    <div className="h-64">
                      {mounted && (
                        <ResponsiveContainer height="100%" width="100%">
                          <LineChart data={priceSeries} margin={{ top: 10, right: 16, left: 10, bottom: 0 }}>
                            <CartesianGrid opacity={0.3} strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => formatDate(String(v))} />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={56} />
                            <Tooltip
                              content={({ active, payload }) => {
                                const row = payload?.[0]?.payload as PaymentHistoryRow | undefined
                                if (!active || !row) return null
                                const lines = [formatCurrency(row.price, row.currency)]
                                if (row.change !== undefined) lines.push(`${formatChange(row.change)} vs previous`)
                                return <ChartTooltip lines={lines} title={formatDate(row.date)} />
                              }}
                            />
                            <Line dataKey="price" dot={{ r: 3 }} stroke={CHART_COLOR} strokeWidth={2} type="stepAfter" />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>

            <Separator />
            <p className="text-muted-foreground text-xs">
              Amounts come from the linked transactions{subscription.recurringId ? ' booked by the recurring transaction' : ''}.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
