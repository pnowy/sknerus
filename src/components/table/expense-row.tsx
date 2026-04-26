import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '../../lib/shared/format'
import type { Expense } from '../../lib/shared/types/expense'

type Props = {
  expense: Expense
  currency: string
  hasTags: boolean
  onEdit: (e: Expense) => void
  onDelete: (id: string) => void
}

export function ExpenseRow({ expense, currency, hasTags, onEdit, onDelete }: Props) {
  return (
    <TableRow>
      <TableCell className="font-medium">{expense.name}</TableCell>
      <TableCell>{expense.category}</TableCell>
      {hasTags && (
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {expense.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">
                {t}
              </Badge>
            ))}
          </div>
        </TableCell>
      )}
      <TableCell className={cn('tabular-nums', expense.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground')}>
        {expense.amount > 0 ? '+' : ''}
        {formatCurrency(Math.abs(expense.amount), currency)}
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDate(expense.date)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button size="icon-sm" variant="ghost" onClick={() => onEdit(expense)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => onDelete(expense.id)}>
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
