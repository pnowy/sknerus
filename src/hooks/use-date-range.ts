import { useNavigate, useSearch } from '@tanstack/react-router'
import { computeDateRange, formatRangeLabel } from '@/lib/shared/date-utils'
import { type CustomDateRange, customDateRangeSchema } from '@/lib/shared/search-params'
import { RangeScope } from '@/lib/shared/types/range-scope'

export function useDateRange(startDate: number) {
  const search = useSearch({ from: '__root__' })
  const scope: RangeScope = search.scope ?? RangeScope.Month
  const offset = search.offset ?? 0
  const navigate = useNavigate()

  const customRange = scope === RangeScope.Custom ? customDateRangeSchema.parse(search) : undefined
  const { from, to } = computeDateRange(scope, offset, startDate, customRange)
  const label = formatRangeLabel(scope, offset, customRange)

  function updateSearch(params: { scope?: RangeScope; offset?: number; from?: string; to?: string }) {
    void navigate({ to: '.', search: (prev) => ({ ...prev, ...params }) })
  }

  return {
    scope,
    offset,
    from,
    to,
    label,
    setScope: (s: RangeScope) => updateSearch({ scope: s, offset: 0, from: undefined, to: undefined }),
    setCustomRange: (range: CustomDateRange) =>
      updateSearch({ ...customDateRangeSchema.parse(range), scope: RangeScope.Custom, offset: 0 }),
    prev: () => updateSearch({ offset: offset - 1 }),
    next: () => updateSearch({ offset: offset + 1 }),
    reset: () => updateSearch({ scope: scope === RangeScope.Custom ? RangeScope.Month : scope, offset: 0, from: undefined, to: undefined }),
    canGoNext: scope !== RangeScope.Custom && offset < 1,
    isCurrentPeriod: scope !== RangeScope.Custom && offset === 0,
    showArrows: scope === RangeScope.Month || scope === RangeScope.Quarter || scope === RangeScope.Year,
  }
}
