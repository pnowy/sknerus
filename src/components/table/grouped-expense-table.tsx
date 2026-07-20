import { ChevronDown, ChevronRight, Copy, Pencil, Repeat, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NoteIndicator } from '@/components/note-indicator'
import { ExpenseCard } from '@/components/table/expense-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useConfig } from '@/hooks/use-expenses'
import { formatCurrency, formatDate } from '@/lib/shared/format'
import type { Category, Expense } from '@/lib/shared/types/expense'
import type { Vehicle } from '@/lib/shared/types/vehicle'
import { resolveVehicleExpenseIcon } from '@/lib/shared/vehicle-icons'
import { cn } from '@/lib/utils'

export const GROUP_SORT_OPTIONS = [
  { value: 'config', label: 'Config order' },
  { value: 'spend', label: 'By spend' },
  { value: 'name', label: 'Alphabetical' },
] as const

export type GroupSort = (typeof GROUP_SORT_OPTIONS)[number]['value']

type Props = {
  expenses: Array<Expense>
  categories: Array<Category>
  vehicles?: Array<Vehicle>
  currency: string
  groupSort: GroupSort
  onEdit: (e: Expense) => void
  onDuplicate: (e: Expense) => void
  onDelete: (id: string) => void
}

type CategoryGroup = {
  category: Category
  expenses: Array<Expense>
  total: number
}

export function GroupedExpenseTable({ expenses, categories, vehicles, currency, groupSort, onEdit, onDuplicate, onDelete }: Props) {
  const { data: config } = useConfig()
  const showTags = config?.showTags ?? true
  const showNotes = config?.showNotes ?? true
  const hasTags = showTags && expenses.some((e) => e.tags.length > 0)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const groups = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.id, c]))
    const catOrder = new Map(categories.map((c, i) => [c.id, i]))
    const map = new Map<string, Array<Expense>>()
    for (const e of expenses) {
      const list = map.get(e.categoryId) ?? []
      list.push(e)
      map.set(e.categoryId, list)
    }
    const result = Array.from(map.entries()).map(
      ([id, items]): CategoryGroup => ({
        category: catMap.get(id) ?? { id, name: id, color: '#888888' },
        expenses: items.sort((a, b) => b.date.localeCompare(a.date)),
        total: items.reduce((sum, e) => sum + e.amount, 0),
      })
    )
    if (groupSort === 'spend') return result.sort((a, b) => a.total - b.total)
    if (groupSort === 'name') return result.sort((a, b) => a.category.name.localeCompare(b.category.name))
    return result.sort((a, b) => (catOrder.get(a.category.id) ?? 99) - (catOrder.get(b.category.id) ?? 99))
  }, [expenses, categories, groupSort])

  function toggleGroup(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const colSpan = 4 + (hasTags ? 1 : 0)

  return (
    <>
      <div className="space-y-3 sm:hidden">
        {groups.map((group) => {
          const isCollapsed = collapsed.has(group.category.id)
          const Icon = isCollapsed ? ChevronRight : ChevronDown
          return (
            <div key={group.category.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                onClick={() => toggleGroup(group.category.id)}
              >
                <span className="flex items-center gap-2 font-semibold text-sm">
                  <Icon className="size-4" />
                  <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: group.category.color }} />
                  {group.category.name}
                  <span className="font-normal text-muted-foreground">({group.expenses.length})</span>
                  {group.category.excludeFromBudget && (
                    <Badge
                      variant="outline"
                      className="font-normal text-muted-foreground text-xs"
                      title="Excluded from budget — tracked for vehicle stats only"
                    >
                      Tracking
                    </Badge>
                  )}
                </span>
                <span className={cn('font-semibold text-sm tabular-nums', group.total > 0 ? 'text-emerald-600 dark:text-emerald-400' : '')}>
                  {group.total > 0 ? '+' : ''}
                  {formatCurrency(Math.abs(group.total), currency)}
                </span>
              </button>
              {!isCollapsed && (
                <div className="mt-1 space-y-1.5 pl-2">
                  {group.expenses.map((expense) => (
                    <ExpenseCard
                      key={expense.id}
                      categories={categories}
                      expense={expense}
                      showTags={showTags}
                      showNotes={showNotes}
                      vehicles={vehicles}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      onEdit={onEdit}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-md border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {hasTags && <TableHead>Tags</TableHead>}
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => {
              const isCollapsed = collapsed.has(group.category.id)
              return (
                <GroupSection
                  key={group.category.id}
                  colSpan={colSpan}
                  currency={currency}
                  group={group}
                  hasTags={hasTags}
                  showNotes={showNotes}
                  isCollapsed={isCollapsed}
                  vehicles={vehicles}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onEdit={onEdit}
                  onToggle={() => toggleGroup(group.category.id)}
                />
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

function GroupSection({
  group,
  colSpan,
  currency,
  hasTags,
  showNotes,
  isCollapsed,
  vehicles,
  onToggle,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  group: CategoryGroup
  colSpan: number
  currency: string
  hasTags: boolean
  showNotes: boolean
  isCollapsed: boolean
  vehicles?: Array<Vehicle>
  onToggle: () => void
  onEdit: (e: Expense) => void
  onDuplicate: (e: Expense) => void
  onDelete: (id: string) => void
}) {
  const Icon = isCollapsed ? ChevronRight : ChevronDown

  return (
    <>
      <TableRow className="cursor-pointer bg-muted/50 hover:bg-muted/80" onClick={onToggle}>
        <TableCell colSpan={colSpan}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold text-sm">
              <Icon className="size-4" />
              <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: group.category.color }} />
              {group.category.name}
              <span className="font-normal text-muted-foreground">({group.expenses.length})</span>
              {group.category.excludeFromBudget && (
                <Badge
                  variant="outline"
                  className="font-normal text-muted-foreground text-xs"
                  title="Excluded from budget — tracked for vehicle stats only"
                >
                  Tracking
                </Badge>
              )}
            </span>
            <span className={cn('font-semibold text-sm tabular-nums', group.total > 0 ? 'text-emerald-600 dark:text-emerald-400' : '')}>
              {group.total > 0 ? '+' : ''}
              {formatCurrency(Math.abs(group.total), currency)}
            </span>
          </div>
        </TableCell>
      </TableRow>
      {!isCollapsed &&
        group.expenses.map((expense) => {
          const vehicleIcon = resolveVehicleExpenseIcon(expense, vehicles)
          return (
            <TableRow key={expense.id}>
              <TableCell className="pl-10 font-medium">
                <span className="flex items-center gap-1.5">
                  {expense.name}
                  {vehicleIcon && (
                    <vehicleIcon.Icon aria-label="Vehicle expense" className="size-3.5 shrink-0" style={{ color: vehicleIcon.color }} />
                  )}
                  {expense.recurringId && <Repeat aria-label="Recurring" className="size-3 shrink-0 text-muted-foreground" />}
                  {showNotes && expense.notes && <NoteIndicator notes={expense.notes} />}
                </span>
              </TableCell>
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
        })}
    </>
  )
}
