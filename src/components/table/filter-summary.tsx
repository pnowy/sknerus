import type { ExpenseSummary } from '@/lib/shared/expense-utils'
import { formatCurrency } from '@/lib/shared/format'
import { cn } from '@/lib/utils'

type Props = {
  summary: ExpenseSummary
  currency: string
}

export function FilterSummary({ summary, currency }: Props) {
  const { count, income, expenses, net } = summary
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" data-testid="filter-summary">
      <span>
        <span className="text-foreground font-medium">{count}</span> {count === 1 ? 'transaction' : 'transactions'} across all time
      </span>
      {income > 0 && (
        <span>
          Income{' '}
          <span className="font-medium text-emerald-600 tabular-nums dark:text-emerald-400">+{formatCurrency(income, currency)}</span>
        </span>
      )}
      {expenses > 0 && (
        <span>
          Expenses <span className="text-foreground font-medium tabular-nums">−{formatCurrency(expenses, currency)}</span>
        </span>
      )}
      {income > 0 && expenses > 0 && (
        <span>
          Net{' '}
          <span className={cn('font-medium tabular-nums', net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground')}>
            {net >= 0 ? '+' : '−'}
            {formatCurrency(Math.abs(net), currency)}
          </span>
        </span>
      )}
    </div>
  )
}
