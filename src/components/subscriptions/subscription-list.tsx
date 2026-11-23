import { BarChart2, Briefcase, CirclePause, Clock, ExternalLink, LayoutList, Pencil, Repeat, Trash2, User } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { type UnderlineTab, UnderlineTabsList } from '@/components/layout/underline-tabs-list'
import { CostBreakdown } from '@/components/subscriptions/cost-breakdown'
import { SubscriptionStatsDialog } from '@/components/subscriptions/subscription-stats-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs } from '@/components/ui/tabs'
import { daysUntil, nextOccurrence, todayISO } from '@/lib/shared/date-utils'
import { formatCurrency, formatDate } from '@/lib/shared/format'
import {
  calcMonthlyCost,
  findProfile,
  formatBillingPeriod,
  matchesFilter,
  RENEWAL_DUE_DAYS,
  RENEWAL_NOTICE_DAYS,
  subscriptionPayments,
} from '@/lib/shared/subscription-utils'
import type { Category, Expense, RecurringExpense } from '@/lib/shared/types/expense'
import { type DeductionProfile, type Subscription, SubscriptionFilter } from '@/lib/shared/types/subscription'
import { cn } from '@/lib/utils'

const FILTER_TABS: Array<UnderlineTab<SubscriptionFilter>> = [
  { value: SubscriptionFilter.All, label: 'All', icon: LayoutList },
  { value: SubscriptionFilter.Private, label: 'Private', icon: User },
  { value: SubscriptionFilter.Business, label: 'Business', icon: Briefcase },
  { value: SubscriptionFilter.Inactive, label: 'Inactive', icon: CirclePause },
]

const SORT_OPTIONS = [
  { value: 'cost', label: 'Monthly cost' },
  { value: 'name', label: 'Name' },
  { value: 'renewal', label: 'Next renewal' },
] as const
type SortKey = (typeof SORT_OPTIONS)[number]['value']

const SHARE_COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ec4899', '#10b981', '#8b5cf6', '#f97316', '#14b8a6', '#ef4444', '#84cc16']

type Props = {
  subscriptions: Array<Subscription>
  profiles: Array<DeductionProfile>
  categories: Array<Category>
  recurring: Array<RecurringExpense>
  expenses: Array<Expense>
  currency: string
  rates: Map<string, number | undefined>
  highlightId?: string
  onEdit: (subscription: Subscription) => void
  onDelete: (subscription: Subscription) => void
}

type Row = {
  subscription: Subscription
  profile?: DeductionProfile
  monthly?: ReturnType<typeof calcMonthlyCost>
  renewal?: string
  linked?: RecurringExpense
  paidSummary?: string
}

function summarizePayments(expenses: Array<Expense>): string | undefined {
  if (expenses.length === 0) return undefined
  const totals = new Map<string, number>()
  for (const expense of expenses) totals.set(expense.currency, (totals.get(expense.currency) ?? 0) + Math.abs(expense.amount))
  const amounts = [...totals].map(([code, total]) => formatCurrency(total, code)).join(' + ')
  return `${expenses.length} payment${expenses.length === 1 ? '' : 's'} · ${amounts}`
}

type RenewalTone = 'upcoming' | 'soon' | 'overdue'

function renewalLabel(date: string, billingPeriodMonths: number): { text: string; tone?: RenewalTone } {
  const days = daysUntil(date)
  if (days < 0) return { text: `Overdue since ${formatDate(date)}`, tone: 'overdue' }
  if (days === 0) return { text: 'Renews today', tone: 'soon' }
  if (days === 1) return { text: 'Renews tomorrow', tone: 'soon' }
  if (days <= RENEWAL_DUE_DAYS) return { text: `Renews in ${days} days`, tone: 'soon' }
  // monthly plans renew all the time, so only longer periods get the early notice
  if (billingPeriodMonths > 1 && days <= RENEWAL_NOTICE_DAYS) {
    return { text: `Renews in ${days} days (${formatDate(date)})`, tone: 'upcoming' }
  }
  return { text: `Renews ${formatDate(date)}` }
}

export function SubscriptionList({
  subscriptions,
  profiles,
  categories,
  recurring,
  expenses,
  currency,
  rates,
  highlightId,
  onEdit,
  onDelete,
}: Props) {
  const [filter, setFilter] = useState<SubscriptionFilter>(SubscriptionFilter.All)
  const [sort, setSort] = useState<SortKey>('cost')
  const [statsFor, setStatsFor] = useState<Subscription | null>(null)
  const categoryById = new Map(categories.map((c) => [c.id, c]))

  const rows = useMemo(() => {
    const today = todayISO()
    const recurringById = new Map(recurring.map((r) => [r.id, r]))
    return subscriptions.map((subscription): Row => {
      const profile = findProfile(profiles, subscription.deductionProfileId)
      const rate = rates.get(subscription.currency)
      const linked = subscription.recurringId ? recurringById.get(subscription.recurringId) : undefined
      // manual renewals are not rolled forward: an overdue date stays visible until booked or skipped
      const renewal = subscription.active ? (linked ? nextOccurrence(linked, today) : subscription.nextRenewal) : undefined
      return {
        subscription,
        profile,
        monthly: rate === undefined ? undefined : calcMonthlyCost(subscription, profile, rate),
        renewal: renewal || undefined,
        linked,
        paidSummary: summarizePayments(subscriptionPayments(subscription, expenses)),
      }
    })
  }, [subscriptions, profiles, recurring, expenses, rates])

  const visible = rows
    .filter((row) => matchesFilter(row.subscription, filter, profiles))
    .sort((a, b) => {
      if (a.subscription.active !== b.subscription.active) return a.subscription.active ? -1 : 1
      if (sort === 'name') return a.subscription.name.localeCompare(b.subscription.name)
      if (sort === 'renewal') return (a.renewal ?? '9999').localeCompare(b.renewal ?? '9999')
      return (b.monthly?.gross ?? 0) - (a.monthly?.gross ?? 0)
    })

  const shareRows = rows
    .flatMap((row) =>
      row.subscription.active && row.monthly ? [{ id: row.subscription.id, name: row.subscription.name, gross: row.monthly.gross }] : []
    )
    .sort((a, b) => b.gross - a.gross)
  const shareTotal = shareRows.reduce((sum, row) => sum + row.gross, 0)

  useEffect(() => {
    if (!highlightId) return
    document.getElementById(`subscription-${highlightId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightId])

  return (
    <div className="space-y-4">
      {shareTotal > 0 && (
        <div className="space-y-2">
          <div className="bg-muted flex h-3 w-full overflow-hidden rounded-full">
            {shareRows.map((row, index) => (
              <div
                key={row.id}
                className="h-full"
                style={{ width: `${(row.gross / shareTotal) * 100}%`, backgroundColor: SHARE_COLORS[index % SHARE_COLORS.length] }}
                title={`${row.name}: ${formatCurrency(row.gross, currency)} / month`}
              />
            ))}
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {shareRows.slice(0, 5).map((row, index) => (
              <span key={row.id} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: SHARE_COLORS[index % SHARE_COLORS.length] }} />
                {row.name} {Math.round((row.gross / shareTotal) * 100)}%
              </span>
            ))}
          </div>
        </div>
      )}

      <Tabs value={filter} onValueChange={(value) => setFilter(value as SubscriptionFilter)}>
        <UnderlineTabsList activeTab={filter} tabs={FILTER_TABS} />
      </Tabs>
      <div className="flex justify-end">
        <Select value={sort} onValueChange={(value) => value && setSort(value as SortKey)}>
          <SelectTrigger className="w-40">
            <SelectValue>{(value: string) => SORT_OPTIONS.find((o) => o.value === value)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 && <p className="text-muted-foreground py-6 text-center text-sm">No subscriptions here.</p>}

      <div className="space-y-2">
        {visible.map(({ subscription, profile, monthly, renewal, linked, paidSummary }) => {
          const category = subscription.categoryId ? categoryById.get(subscription.categoryId) : undefined
          const renewalInfo = renewal ? renewalLabel(renewal, subscription.billingPeriodMonths) : undefined
          const showOriginal = subscription.currency !== currency || subscription.billingPeriodMonths !== 1
          return (
            <div
              key={subscription.id}
              className={cn(
                'flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors',
                !subscription.active && 'opacity-60',
                highlightId === subscription.id && 'border-primary ring-primary/30 ring-2'
              )}
              id={`subscription-${subscription.id}`}
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <span
                  className="bg-muted-foreground/40 mt-1.5 size-2.5 shrink-0 rounded-full"
                  style={category ? { backgroundColor: category.color } : undefined}
                  title={category?.name}
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{subscription.name}</span>
                    {subscription.url && (
                      <a
                        aria-label={`Open ${subscription.name} website`}
                        className="text-muted-foreground hover:text-foreground"
                        href={subscription.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                    {profile && (
                      <Badge className="text-xs" variant="secondary">
                        {profile.name}
                      </Badge>
                    )}
                    {!subscription.active && (
                      <Badge className="text-xs" variant="outline">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                    <span>
                      {formatBillingPeriod(subscription.billingPeriodMonths)}
                      {showOriginal && ` · ${formatCurrency(subscription.amount, subscription.currency)}`}
                    </span>
                    {linked && (
                      <span className="flex items-center gap-1" title={`Booked as recurring transaction "${linked.name}"`}>
                        <Repeat className="size-3" />
                        In transactions
                      </span>
                    )}
                    {renewalInfo && (
                      <span
                        className={cn(
                          'flex items-center gap-1',
                          renewalInfo.tone === 'upcoming' && 'text-sky-600 dark:text-sky-400',
                          renewalInfo.tone === 'soon' && 'text-yellow-600 dark:text-yellow-500',
                          renewalInfo.tone === 'overdue' && 'text-destructive'
                        )}
                      >
                        {renewalInfo.tone === 'upcoming' && <Clock className="size-3" />}
                        {renewalInfo.text}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="text-right">
                  {monthly ? (
                    <>
                      <p className="text-sm font-medium tabular-nums">{formatCurrency(monthly.gross, currency)}</p>
                      {profile && (
                        <p className="text-xs text-emerald-600 tabular-nums dark:text-emerald-400">
                          {formatCurrency(monthly.effective, currency)}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm" title="Exchange rate unavailable">
                      —
                    </p>
                  )}
                </div>
                {monthly && <CostBreakdown currency={currency} monthly={monthly} paidSummary={paidSummary} profile={profile} />}
                <Button aria-label="Show subscription stats" size="icon-sm" variant="ghost" onClick={() => setStatsFor(subscription)}>
                  <BarChart2 className="size-3.5" />
                </Button>
                <Button aria-label="Edit subscription" size="icon-sm" variant="ghost" onClick={() => onEdit(subscription)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button aria-label="Delete subscription" size="icon-sm" variant="ghost" onClick={() => onDelete(subscription)}>
                  <Trash2 className="text-destructive size-3.5" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
      {statsFor && (
        <SubscriptionStatsDialog
          currency={currency}
          expenses={expenses}
          profile={findProfile(profiles, statsFor.deductionProfileId)}
          subscription={statsFor}
          onClose={() => setStatsFor(null)}
        />
      )}
    </div>
  )
}
