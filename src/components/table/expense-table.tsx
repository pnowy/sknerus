import { ArrowUpDown } from 'lucide-react'
import { useState } from 'react'
import { ExpenseRow } from '@/components/table/expense-row'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Category, Expense } from '@/lib/shared/types/expense'

type SortField = 'name' | 'category' | 'amount' | 'date'
type SortDir = 'asc' | 'desc'

type Props = {
  expenses: Array<Expense>
  categories: Array<Category>
  currency: string
  onEdit: (e: Expense) => void
  onDelete: (id: string) => void
}

export function ExpenseTable({ expenses, categories, currency, onEdit, onDelete }: Props) {
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const hasTags = expenses.some((e) => e.tags.length > 0)
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
    else cmp = a.date.localeCompare(b.date)
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
    <div className="rounded-md border">
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
              currency={currency}
              expense={expense}
              hasTags={hasTags}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
