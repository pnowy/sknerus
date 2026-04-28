import { useMonthNavContext } from '@/contexts/month-nav-context'
import type { Month } from '@/lib/shared/date-utils'

export function useMonthNav() {
  const { offset, setOffset } = useMonthNavContext()

  const date = new Date()
  date.setMonth(date.getMonth() + offset)

  return {
    year: date.getFullYear(),
    month: date.getMonth() as Month,
    label: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
    prev: () => setOffset((o) => o - 1),
    next: () => setOffset((o) => o + 1),
    reset: () => setOffset(() => 0),
    canGoNext: offset < 0,
    isCurrentMonth: offset === 0,
  }
}
