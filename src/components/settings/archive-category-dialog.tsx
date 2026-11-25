import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { CategoryUsage } from '@/lib/shared/category-utils'
import { formatCurrency, formatDate } from '@/lib/shared/format'
import type { Category } from '@/lib/shared/types/expense'

type Props = {
  category: Category
  usage: CategoryUsage
  currency: string
  onConfirm: () => void
  onClose: () => void
}

export function ArchiveCategoryDialog({ category, usage, currency, onConfirm, onClose }: Props) {
  const { transactionCount, total, firstTransaction, lastTransaction, activeRecurring, activeSubscriptions } = usage

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Archive {category.name}?</DialogTitle>
          <DialogDescription>
            It won't be offered when adding transactions, recurring transactions or subscriptions. Existing transactions keep it, and charts
            and the table still show it. You can restore it anytime.
          </DialogDescription>
        </DialogHeader>

        {transactionCount > 0 && lastTransaction && firstTransaction ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Transactions</dt>
            <dd>{transactionCount}</dd>
            <dt className="text-muted-foreground">Latest</dt>
            <dd>
              {formatDate(lastTransaction.date)}
              <span className="text-muted-foreground">
                {' '}
                · {lastTransaction.name} <span className="whitespace-nowrap">({formatCurrency(lastTransaction.amount, currency)})</span>
              </span>
            </dd>
            <dt className="text-muted-foreground">First</dt>
            <dd>{formatDate(firstTransaction.date)}</dd>
            <dt className="text-muted-foreground">Total</dt>
            <dd>{formatCurrency(total, currency)}</dd>
            <dd className="col-start-2">
              <a
                className="text-primary inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
                rel="noopener"
                target="_blank"
                href={`/table?category=${encodeURIComponent(category.id)}`}
              >
                Show transactions
                <ExternalLink className="size-3.5" />
              </a>
            </dd>
          </dl>
        ) : (
          <p className="text-muted-foreground text-sm">No transactions use this category yet.</p>
        )}

        {(activeRecurring.length > 0 || activeSubscriptions.length > 0) && (
          <div className="space-y-1 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            {activeRecurring.length > 0 && (
              <p>
                Still used by recurring transactions, which will keep booking into it:{' '}
                <span className="font-medium">{activeRecurring.map((r) => r.name).join(', ')}</span>
              </p>
            )}
            {activeSubscriptions.length > 0 && (
              <p>
                Still used by active subscriptions: <span className="font-medium">{activeSubscriptions.map((s) => s.name).join(', ')}</span>
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Archive</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
