import { useMonthNavContext } from '@/contexts/month-nav-context'

export function useMonthNav() {
  const { offset, setOffset } = useMonthNavContext()

  const date = new Date()
  date.setMonth(date.getMonth() + offset)

  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    label: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
    prev: () => setOffset((o) => o - 1),
    next: () => setOffset((o) => o + 1),
    reset: () => setOffset(() => 0),
    canGoNext: offset < 0,
    isCurrentMonth: offset === 0,
  }
}
