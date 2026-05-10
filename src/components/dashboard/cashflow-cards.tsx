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
          <CardTitle className="font-medium text-muted-foreground text-sm">Income</CardTitle>
          <TrendingUp className="size-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <p className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">{formatCurrency(income, currency)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-muted-foreground text-sm">Expenses</CardTitle>
          <TrendingDown className="size-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <p className="font-bold text-2xl text-red-600 dark:text-red-400">{formatCurrency(expenses, currency)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-muted-foreground text-sm">Balance</CardTitle>
          <Wallet className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p
            className={cn('font-bold text-2xl', balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}
          >
            {formatCurrency(balance, currency)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
