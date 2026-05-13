import { Copy, MoreHorizontal, Pencil, Repeat, Trash2 } from 'lucide-react'
import { NoteIndicator } from '@/components/note-indicator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDate } from '@/lib/shared/format'
import type { Category, Expense } from '@/lib/shared/types/expense'
import type { Vehicle } from '@/lib/shared/types/vehicle'
import { DEFAULT_EXPENSE_TYPE_ICON, getExpenseTypeIcon } from '@/lib/shared/vehicle-icons'
import { cn } from '@/lib/utils'

type Props = {
  expense: Expense
  categories: Array<Category>
  showTags: boolean
  showNotes: boolean
  vehicles?: Array<Vehicle>
  onEdit: (e: Expense) => void
  onDuplicate: (e: Expense) => void
  onDelete: (id: string) => void
}

export function ExpenseCard({ expense, categories, showTags, showNotes, vehicles, onEdit, onDuplicate, onDelete }: Props) {
  const category = categories.find((c) => c.id === expense.categoryId)
  const categoryName = category?.name ?? expense.categoryId
  const vehicle = expense.vehicleExpense ? vehicles?.find((v) => v.id === expense.vehicleExpense?.vehicleId) : undefined
  const expenseType = expense.vehicleExpense?.expenseType
  const VehicleIcon =
    vehicle && expenseType ? getExpenseTypeIcon(vehicle.expenseTypeIcons?.[expenseType] ?? DEFAULT_EXPENSE_TYPE_ICON[expenseType]) : null

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-1.5 font-medium text-sm">
          {expense.name}
          {VehicleIcon && <VehicleIcon aria-label="Vehicle expense" className="size-3.5 shrink-0 text-muted-foreground" />}
          {expense.recurringId && <Repeat aria-label="Recurring" className="size-3 shrink-0 text-muted-foreground" />}
          {showNotes && expense.notes && <NoteIndicator notes={expense.notes} />}
        </span>
        <span className="flex flex-col items-end">
          <span className={cn('font-medium text-sm tabular-nums', expense.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : '')}>
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
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
          {category && <span className="inline-block size-2.5 rounded-sm" style={{ backgroundColor: category.color }} />}
          <span>{categoryName}</span>
          <span>·</span>
          <span>{formatDate(expense.date)}</span>
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" className="-mr-1 size-6" />}>
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(expense)}>
              <Pencil className="size-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(expense)}>
              <Copy className="size-3.5" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(expense.id)}>
              <Trash2 className="size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {showTags && expense.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {expense.tags.map((t) => (
            <Badge key={t} variant="secondary" className="text-xs">
              {t}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
