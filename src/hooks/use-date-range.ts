import { useNavigate, useRouterState } from '@tanstack/react-router'
import { computeDateRange, formatRangeLabel } from '@/lib/shared/date-utils'
import { RangeScope } from '@/lib/shared/types/range-scope'

export function useDateRange(startDate: number) {
  const search = useRouterState({ select: (s) => s.location.search }) as { scope?: RangeScope; offset?: number }
  const scope: RangeScope = search.scope ?? RangeScope.Month
  const offset = search.offset ?? 0
  const navigate = useNavigate()

  const { from, to } = computeDateRange(scope, offset, startDate)
  const label = formatRangeLabel(scope, offset)

  function updateSearch(params: { scope?: RangeScope; offset?: number }) {
    // biome-ignore lint/suspicious/noExplicitAny: search params validated by root route schema
    void navigate({ search: (prev: any) => ({ ...prev, ...params }) } as any)
  }

  return {
    scope,
    offset,
    from,
    to,
    label,
    setScope: (s: RangeScope) => updateSearch({ scope: s, offset: 0 }),
    prev: () => updateSearch({ offset: offset - 1 }),
    next: () => updateSearch({ offset: offset + 1 }),
    reset: () => updateSearch({ offset: 0 }),
    canGoNext: offset < 1,
    isCurrentPeriod: offset === 0,
    showArrows: scope === RangeScope.Month || scope === RangeScope.Quarter || scope === RangeScope.Year,
  }
}
