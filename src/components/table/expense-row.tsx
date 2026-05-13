import { Copy, Pencil, Repeat, Trash2 } from 'lucide-react'
import { NoteIndicator } from '@/components/note-indicator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/shared/format.ts'
import type { Category, Expense } from '@/lib/shared/types/expense.ts'
import type { Vehicle } from '@/lib/shared/types/vehicle'
import { DEFAULT_EXPENSE_TYPE_ICON, getExpenseTypeIcon } from '@/lib/shared/vehicle-icons'
import { cn } from '@/lib/utils'

type Props = {
  expense: Expense
  categories: Array<Category>
  vehicles?: Array<Vehicle>
  hasTags: boolean
  showNotes: boolean
  onEdit: (e: Expense) => void
  onDuplicate: (e: Expense) => void
  onDelete: (id: string) => void
}

export function ExpenseRow({ expense, categories, vehicles, hasTags, showNotes, onEdit, onDuplicate, onDelete }: Props) {
  const categoryName = categories.find((c) => c.id === expense.categoryId)?.name ?? expense.categoryId
  const vehicle = expense.vehicleExpense ? vehicles?.find((v) => v.id === expense.vehicleExpense?.vehicleId) : undefined
  const expenseType = expense.vehicleExpense?.expenseType
  const VehicleIcon =
    vehicle && expenseType ? getExpenseTypeIcon(vehicle.expenseTypeIcons?.[expenseType] ?? DEFAULT_EXPENSE_TYPE_ICON[expenseType]) : null

  return (
    <TableRow>
      <TableCell className="font-medium">
        <span className="flex items-center gap-1.5">
          {expense.name}
          {VehicleIcon && <VehicleIcon aria-label="Vehicle expense" className="size-3.5 shrink-0 text-muted-foreground" />}
          {expense.recurringId && <Repeat aria-label="Recurring" className="size-3 shrink-0 text-muted-foreground" />}
          {showNotes && expense.notes && <NoteIndicator notes={expense.notes} />}
        </span>
      </TableCell>
      <TableCell>{categoryName}</TableCell>
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
        <span className="flex flex-col">
          <span>
            {expense.amount > 0 ? '+' : ''}
            {formatCurrency(Math.abs(expense.amount), expense.currency)}
          </span>
          {expense.originalCurrency && expense.originalAmount !== undefined && (
            <span className="text-muted-foreground text-xs tabular-nums">
              {expense.originalAmount > 0 ? '+' : ''}
              {formatCurrency(Math.abs(expense.originalAmount), expense.originalCurrency)}
            </span>
          )}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDate(expense.date)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button size="icon-sm" variant="ghost" onClick={() => onEdit(expense)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => onDuplicate(expense)}>
            <Copy className="size-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => onDelete(expense.id)}>
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
