import { Building2, CalendarClock, CreditCard, PiggyBank } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/shared/format'
import type { SubscriptionSummary as Summary } from '@/lib/shared/subscription-utils'

type Props = {
  summary: Summary
  currency: string
}

function StatCard({ title, icon, value, hint }: { title: string; icon: React.ReactNode; value: string; hint: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
      </CardContent>
    </Card>
  )
}

export function SubscriptionSummary({ summary, currency }: Props) {
  const savings = summary.monthly.vatBack + summary.monthly.taxBack
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        hint={`${summary.activeCount} active subscription${summary.activeCount === 1 ? '' : 's'}`}
        icon={<CreditCard className="text-muted-foreground size-4" />}
        title="Monthly"
        value={formatCurrency(summary.monthly.gross, currency)}
      />
      <StatCard
        hint="What it really costs you"
        icon={<Building2 className="text-muted-foreground size-4" />}
        title="After deductions"
        value={formatCurrency(summary.monthly.effective, currency)}
      />
      <StatCard
        hint={`${formatCurrency(summary.yearly.effective, currency)} after deductions`}
        icon={<CalendarClock className="text-muted-foreground size-4" />}
        title="Yearly"
        value={formatCurrency(summary.yearly.gross, currency)}
      />
      <StatCard
        hint={`${summary.businessCount} business subscription${summary.businessCount === 1 ? '' : 's'} · per month`}
        icon={<PiggyBank className="size-4 text-emerald-500" />}
        title="Tax savings"
        value={formatCurrency(savings, currency)}
      />
    </div>
  )
}
