import { BellRing } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSkipSubscriptionRenewal, useUpdateSubscription } from '@/hooks/use-subscriptions'
import { formatCurrency, formatDate } from '@/lib/shared/format'
import type { DueRenewal } from '@/lib/shared/subscription-utils'
import type { Subscription } from '@/lib/shared/types/subscription'
import { cn } from '@/lib/utils'

type Props = {
  due: Array<DueRenewal>
  onBook: (subscription: Subscription) => void
}

function dueLabel(daysLeft: number): string {
  if (daysLeft < 0) return `Overdue by ${-daysLeft} day${daysLeft === -1 ? '' : 's'}`
  if (daysLeft === 0) return 'Due today'
  if (daysLeft === 1) return 'Due tomorrow'
  return `Due in ${daysLeft} days`
}

export function RenewalsDue({ due, onBook }: Props) {
  const skip = useSkipSubscriptionRenewal()
  const update = useUpdateSubscription()

  async function handleSkip(subscription: Subscription) {
    try {
      await skip.mutateAsync(subscription.id)
      toast.success(`${subscription.name} renewal skipped`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to skip renewal')
    }
  }

  async function handleEnd({ id, ...subscription }: Subscription) {
    try {
      await update.mutateAsync({ ...subscription, id, active: false })
      toast.success(`${subscription.name} ended`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to end subscription')
    }
  }

  if (due.length === 0) return null
  const busy = skip.isPending || update.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="size-4" />
          Due for renewal
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {due.map(({ subscription, date, daysLeft }) => (
          <div key={subscription.id} className="flex flex-wrap items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{subscription.name}</p>
              <p className="text-muted-foreground text-xs">
                <span className={cn(daysLeft < 0 ? 'text-destructive' : 'text-yellow-600 dark:text-yellow-500')}>{dueLabel(daysLeft)}</span>
                {' · '}
                {formatDate(date)} · {formatCurrency(subscription.amount, subscription.currency)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onBook(subscription)}>
                Book payment
              </Button>
              <Button disabled={busy} size="sm" variant="outline" onClick={() => handleSkip(subscription)}>
                Skip
              </Button>
              <Button disabled={busy} size="sm" variant="ghost" onClick={() => handleEnd(subscription)}>
                End
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
