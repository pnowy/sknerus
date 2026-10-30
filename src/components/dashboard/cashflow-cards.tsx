import { TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/shared/format.ts'
import { cn } from '@/lib/utils'

type Props = {
  income: number
  expenses: number
  currency: string
}

export function CashflowCards({ income, expenses, currency }: Props) {
  const balance = income - expenses
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">Income</CardTitle>
          <TrendingUp className="size-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(income, currency)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">Expenses</CardTitle>
          <TrendingDown className="size-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(expenses, currency)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">Balance</CardTitle>
          <Wallet className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <p
            className={cn('text-2xl font-bold', balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}
          >
            {formatCurrency(balance, currency)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
