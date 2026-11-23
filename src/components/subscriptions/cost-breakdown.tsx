import { Info } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatCurrency } from '@/lib/shared/format'
import type { CostBreakdown as Breakdown } from '@/lib/shared/subscription-utils'
import type { DeductionProfile } from '@/lib/shared/types/subscription'

type Props = {
  monthly: Breakdown
  currency: string
  profile?: DeductionProfile
  /** e.g. "12 payments · 323.88 PLN" for subscriptions linked to recurring transactions */
  paidSummary?: string
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-6">
      <span className={strong ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
      <span className={strong ? 'font-medium tabular-nums' : 'tabular-nums'}>{value}</span>
    </div>
  )
}

export function CostBreakdown({ monthly, currency, profile, paidSummary }: Props) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Show cost breakdown"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring -m-1 inline-flex shrink-0 cursor-pointer items-center rounded p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-1 text-xs">
        <p className="mb-1 font-medium">Per month</p>
        <Line label="Price" value={formatCurrency(monthly.gross, currency)} />
        {profile && (
          <>
            <Line
              label={`VAT back (${profile.vatRecoverable}% of ${profile.vatRate}%)`}
              value={`−${formatCurrency(monthly.vatBack, currency)}`}
            />
            <Line
              label={`Tax back (${profile.incomeTaxRate + profile.extraRate}%)`}
              value={`−${formatCurrency(monthly.taxBack, currency)}`}
            />
          </>
        )}
        <div className="border-t pt-1">
          <Line label="Real cost" strong value={formatCurrency(monthly.effective, currency)} />
        </div>
        {paidSummary && <p className="text-muted-foreground border-t pt-1">Paid so far: {paidSummary}</p>}
      </PopoverContent>
    </Popover>
  )
}
