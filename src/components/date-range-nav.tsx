import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
}

type Props = {
  scope: RangeScope
  label: string
  onScopeChange: (scope: RangeScope) => void
  onPrev: () => void
  onNext: () => void
  onReset: () => void
  canGoNext: boolean
  isCurrentPeriod: boolean
  showArrows: boolean
}

export function DateRangeNav({ scope, label, onScopeChange, onPrev, onNext, onReset, canGoNext, isCurrentPeriod, showArrows }: Props) {
  return (
    <div className="flex items-center gap-1">
      <Select value={scope} onValueChange={(v) => v && onScopeChange(v as RangeScope)}>
        <SelectTrigger size="sm" className="w-28 sm:w-36">
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
      <span className="min-w-24 text-center font-medium text-sm sm:min-w-36">{label}</span>
      {showArrows && (
        <Button disabled={!canGoNext} size="icon" variant="ghost" onClick={onNext}>
          <ChevronRight className="size-4" />
        </Button>
      )}
      {!isCurrentPeriod && (
        <Button size="icon" variant="ghost" title="Back to current period" onClick={onReset}>
          <RotateCcw className="size-3.5" />
        </Button>
      )}
    </div>
  )
}
