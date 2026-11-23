import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useDeleteSubscription } from '@/hooks/use-subscriptions'
import type { Subscription } from '@/lib/shared/types/subscription'

type Props = {
  subscription: Subscription
  onClose: () => void
}

export function DeleteSubscriptionDialog({ subscription, onClose }: Props) {
  const deleteSubscription = useDeleteSubscription()
  const [withRecurring, setWithRecurring] = useState(false)

  async function confirmDelete() {
    try {
      await deleteSubscription.mutateAsync({ id: subscription.id, withRecurring })
      toast.success(`${subscription.name} deleted`)
      onClose()
    } catch {
      toast.error('Failed to delete subscription')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {subscription.name}?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>The subscription will be removed from the tracker.</p>
          {subscription.recurringId && (
            <label className="flex cursor-pointer items-start gap-2">
              <input
                checked={withRecurring}
                className="accent-primary mt-0.5 size-4"
                type="checkbox"
                onChange={(e) => setWithRecurring(e.target.checked)}
              />
              <span>
                Also delete the linked recurring transaction
                <span className="text-muted-foreground block text-xs">Transactions already booked are kept either way.</span>
              </span>
            </label>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={deleteSubscription.isPending} variant="destructive" onClick={confirmDelete}>
            {deleteSubscription.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
