import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { getEnteredAmount, getEnteredCurrency } from '@/lib/shared/expense-utils'
import { formatCurrency, formatDate } from '@/lib/shared/format'
import type { Expense } from '@/lib/shared/types/expense'

const MAX_RESULTS = 100

type Props = {
  expenses: Array<Expense>
  /** Prefills the search, e.g. the subscription name */
  initialQuery: string
  selectedIds: Array<string>
  /** Transactions already paying for another subscription */
  takenIds: Set<string>
  onConfirm: (ids: Array<string>) => void
  onClose: () => void
}

function tokens(query: string): Array<string> {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length >= 2)
}

/** Expenses whose name or notes contain any query word, newest first */
function search(expenses: Array<Expense>, query: string): Array<Expense> {
  const words = tokens(query)
  return expenses
    .filter((expense) => {
      if (words.length === 0) return true
      const haystack = `${expense.name} ${expense.notes ?? ''}`.toLowerCase()
      return words.some((word) => haystack.includes(word))
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_RESULTS)
}

export function LinkPaymentsDialog({ expenses, initialQuery, selectedIds, takenIds, onConfirm, onClose }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [selected, setSelected] = useState(() => new Set(selectedIds))
  const candidates = expenses.filter((expense) => expense.amount < 0 && !takenIds.has(expense.id))
  const results = search(candidates, query)

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link payments</DialogTitle>
        </DialogHeader>
        <Input
          aria-label="Search transactions"
          placeholder="Search transactions"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {results.length === 0 && <p className="text-muted-foreground py-6 text-center text-sm">No matching expenses</p>}
          {results.map((expense) => (
            <label key={expense.id} className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm">
              <input
                checked={selected.has(expense.id)}
                className="accent-primary size-4 shrink-0"
                type="checkbox"
                onChange={(e) => toggle(expense.id, e.target.checked)}
              />
              <span className="text-muted-foreground w-24 shrink-0 tabular-nums">{formatDate(expense.date)}</span>
              <span className="min-w-0 flex-1 truncate">{expense.name}</span>
              <span className="shrink-0 tabular-nums">
                {formatCurrency(Math.abs(getEnteredAmount(expense)), getEnteredCurrency(expense))}
              </span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm([...selected])
              onClose()
            }}
          >
            Link {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
