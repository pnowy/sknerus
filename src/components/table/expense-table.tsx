import { ArrowUpDown } from 'lucide-react'
import { useState } from 'react'
import { ExpenseCard } from '@/components/table/expense-card'
import { ExpenseRow } from '@/components/table/expense-row'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useConfig } from '@/hooks/use-expenses'
import { compareExpensesByDate } from '@/lib/shared/expense-utils'
import type { Category, Expense } from '@/lib/shared/types/expense'
import type { Vehicle } from '@/lib/shared/types/vehicle'

type SortField = 'name' | 'category' | 'amount' | 'date'
type SortDir = 'asc' | 'desc'

const SORT_OPTIONS: Array<{ value: SortField; label: string }> = [
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'name', label: 'Name' },
  { value: 'category', label: 'Category' },
]

type Props = {
  expenses: Array<Expense>
  categories: Array<Category>
  vehicles?: Array<Vehicle>
  onEdit: (e: Expense) => void
  onDuplicate: (e: Expense) => void
  onDelete: (id: string) => void
}

export function ExpenseTable({ expenses, categories, vehicles, onEdit, onDuplicate, onDelete }: Props) {
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const { data: config } = useConfig()
  const showTags = config?.showTags ?? true
  const showNotes = config?.showNotes ?? true
  const hasTags = showTags && expenses.some((e) => e.tags.length > 0)
  const catNameMap = new Map(categories.map((c) => [c.id, c.name]))

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sorted = [...expenses].sort((a, b) => {
    let cmp = 0
    if (sortField === 'amount') cmp = a.amount - b.amount
    else if (sortField === 'name') cmp = a.name.localeCompare(b.name)
    else if (sortField === 'category') cmp = (catNameMap.get(a.categoryId) ?? '').localeCompare(catNameMap.get(b.categoryId) ?? '')
    else cmp = compareExpensesByDate(a, b)
    return sortDir === 'asc' ? cmp : -cmp
  })

  function SortButton({ field, label }: { field: SortField; label: string }) {
    return (
      <Button className="-ml-3 h-auto px-3 py-1 font-medium" size="sm" variant="ghost" onClick={() => toggleSort(field)}>
        {label}
        <ArrowUpDown className="ml-1 size-3 opacity-50" />
      </Button>
    )
  }

  return (
    <>
      <div className="space-y-2 sm:hidden">
        <div className="flex items-center gap-2">
          <Select value={sortField} onValueChange={(v) => v && toggleSort(v as SortField)}>
            <SelectTrigger size="sm" className="w-28">
              <SelectValue>{(value: string) => SORT_OPTIONS.find((o) => o.value === value)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" className="size-8 px-0" onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}>
            <ArrowUpDown className="size-3.5" />
          </Button>
        </div>
        {sorted.map((expense) => (
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

      <div className="hidden overflow-x-auto rounded-md border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortButton field="name" label="Name" />
              </TableHead>
              <TableHead>
                <SortButton field="category" label="Category" />
              </TableHead>
              {hasTags && <TableHead>Tags</TableHead>}
              <TableHead>
                <SortButton field="amount" label="Amount" />
              </TableHead>
              <TableHead>
                <SortButton field="date" label="Date" />
              </TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((expense) => (
              <ExpenseRow
                key={expense.id}
                categories={categories}
                expense={expense}
                vehicles={vehicles}
                hasTags={hasTags}
                showNotes={showNotes}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onEdit={onEdit}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
