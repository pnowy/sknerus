import { Link } from '@tanstack/react-router'
import { CreditCard, Pencil, Plus, Repeat, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { RecurringFormDialog } from '@/components/settings/recurring-form-dialog'
import { SubscriptionFormDialog } from '@/components/subscriptions/subscription-form-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useConfig, useDeleteRecurring, useExpenses, useRecurring } from '@/hooks/use-expenses'
import { useSubscriptions } from '@/hooks/use-subscriptions'
import { formatCurrency } from '@/lib/shared/format'
import { isConvertibleRecurring } from '@/lib/shared/subscription-utils'
import type { Category, RecurringExpense } from '@/lib/shared/types/expense'

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatFrequency(r: RecurringExpense): string {
  const n = r.interval ?? 1
  switch (r.frequency) {
    case 'daily':
      return n > 1 ? `Every ${n} days` : 'Daily'
    case 'weekly':
      return n > 1 ? `Every ${n} weeks, ${DAYS_OF_WEEK[r.dayOfWeek ?? 0]}` : `Every ${DAYS_OF_WEEK[r.dayOfWeek ?? 0]}`
    case 'monthly':
      return n > 1 ? `Every ${n} months, day ${r.dayOfMonth ?? 1}` : `Monthly, day ${r.dayOfMonth ?? 1}`
    case 'yearly':
      return `${n > 1 ? `Every ${n} years` : 'Yearly'}, ${MONTHS[(r.month ?? 1) - 1]} ${r.dayOfMonth ?? 1}`
  }
}

type Props = {
  categories: Array<Category>
  currency: string
}

export function RecurringList({ categories, currency }: Props) {
  const { data: recurring = [] } = useRecurring()
  const { data: allExpenses = [] } = useExpenses()
  const deleteRecurring = useDeleteRecurring()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RecurringExpense | undefined>()
  const [tracking, setTracking] = useState<RecurringExpense | null>(null)
  const { data: config } = useConfig()
  const subscriptionsEnabled = config?.features?.subscriptionTracking ?? false
  const { data: subscriptions = [] } = useSubscriptions(subscriptionsEnabled)
  const subscriptionByRecurring = new Map(subscriptions.filter((s) => s.recurringId).map((s) => [s.recurringId, s]))

  const allTags = [...new Set(allExpenses.flatMap((e) => e.tags))].sort()
  const catMap = new Map(categories.map((c) => [c.id, c.name]))

  async function handleDelete(id: string) {
    try {
      await deleteRecurring.mutateAsync(id)
      toast.success('Recurring deleted')
    } catch {
      toast.error('Failed to delete recurring')
    }
  }

  function openAdd() {
    setEditing(undefined)
    setDialogOpen(true)
  }

  function openEdit(r: RecurringExpense) {
    setEditing(r)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-3">
      {recurring.length === 0 && <p className="text-muted-foreground text-sm">No recurring transactions yet.</p>}
      {recurring.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <Repeat className="text-muted-foreground size-4 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium">{r.name}</p>
                {subscriptionsEnabled && subscriptionByRecurring.has(r.id) && (
                  <Badge
                    className="text-xs"
                    render={<Link search={{ highlight: subscriptionByRecurring.get(r.id)?.id }} to="/subscriptions" />}
                    variant="secondary"
                  >
                    Subscription
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                {formatFrequency(r)} · {catMap.get(r.categoryId) ?? r.categoryId}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`text-sm tabular-nums ${r.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
              {r.amount > 0 ? '+' : ''}
              {formatCurrency(Math.abs(r.amount), currency)}
            </span>
            {subscriptionsEnabled && !subscriptionByRecurring.has(r.id) && isConvertibleRecurring(r) && (
              <Button
                aria-label="Track as subscription"
                size="icon-sm"
                title="Track as subscription"
                variant="ghost"
                onClick={() => setTracking(r)}
              >
                <CreditCard className="size-3.5" />
              </Button>
            )}
            <Button size="icon-sm" variant="ghost" onClick={() => openEdit(r)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => handleDelete(r.id)}>
              <Trash2 className="text-destructive size-3.5" />
            </Button>
          </div>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={openAdd}>
        <Plus className="size-4" />
        Add recurring
      </Button>
      {dialogOpen && (
        <RecurringFormDialog
          allTags={allTags}
          categories={categories}
          currency={currency}
          recurring={editing}
          onClose={() => setDialogOpen(false)}
        />
      )}
      {tracking && <SubscriptionFormDialog fromRecurring={tracking} onClose={() => setTracking(null)} />}
    </div>
  )
}
