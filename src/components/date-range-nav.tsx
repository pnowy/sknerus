import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { CustomDateRangeDialog } from '@/components/custom-date-range-dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CustomDateRange } from '@/lib/shared/search-params'
import { RangeScope } from '@/lib/shared/types/range-scope'

const SCOPE_LABELS: Record<RangeScope, string> = {
  [RangeScope.Month]: 'Month',
  [RangeScope.Quarter]: 'Quarter',
  [RangeScope.Year]: 'Year',
  [RangeScope.Ytd]: 'YTD',
  [RangeScope.LastYear]: 'Last Year',
  [RangeScope.ThreeYears]: '3 Years',
  [RangeScope.FiveYears]: '5 Years',
  [RangeScope.All]: 'All Time',
  [RangeScope.Custom]: 'Custom',
}

type Props = {
  scope: RangeScope
  label: string
  from: Date
  to: Date
  onScopeChange: (scope: RangeScope) => void
  onCustomRangeChange: (range: CustomDateRange) => void
  onPrev: () => void
  onNext: () => void
  onReset: () => void
  canGoNext: boolean
  isCurrentPeriod: boolean
  showArrows: boolean
}

export function DateRangeNav({
  scope,
  label,
  from,
  to,
  onScopeChange,
  onCustomRangeChange,
  onPrev,
  onNext,
  onReset,
  canGoNext,
  isCurrentPeriod,
  showArrows,
}: Props) {
  const [customOpen, setCustomOpen] = useState(false)

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      <Select
        value={scope}
        onValueChange={(value: RangeScope | null) => {
          if (value === RangeScope.Custom) setCustomOpen(true)
          else if (value) onScopeChange(value)
        }}
      >
        <SelectTrigger size="sm" className="w-28 sm:w-36" aria-label="Date range">
          <SelectValue>{(value: string) => SCOPE_LABELS[value as RangeScope]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(SCOPE_LABELS) as Array<[RangeScope, string]>).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showArrows && (
        <Button size="icon" variant="ghost" onClick={onPrev}>
          <ChevronLeft className="size-4" />
        </Button>
      )}
      {scope === RangeScope.Custom ? (
        <Button variant="ghost" size="sm" aria-label={`Edit custom date range: ${label}`} onClick={() => setCustomOpen(true)}>
          {label}
        </Button>
      ) : (
        <span className="min-w-24 text-center font-medium text-sm sm:min-w-36">{label}</span>
      )}
      {showArrows && (
        <Button disabled={!canGoNext} size="icon" variant="ghost" onClick={onNext}>
          <ChevronRight className="size-4" />
        </Button>
      )}
      {!isCurrentPeriod && (
        <Button size="icon" variant="ghost" title="Back to current period" aria-label="Back to current period" onClick={onReset}>
          <RotateCcw className="size-3.5" />
        </Button>
      )}
      {customOpen && <CustomDateRangeDialog from={from} to={to} onApply={onCustomRangeChange} onClose={() => setCustomOpen(false)} />}
    </div>
  )
}
