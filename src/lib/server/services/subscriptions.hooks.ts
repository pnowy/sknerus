import type { RecurringHooks } from '@/lib/server/plugins/recurring-hooks'
import { storage } from '@/lib/server/storage'
import { todayISO } from '@/lib/shared/date-utils'
import { applyRecurringToSubscription } from '@/lib/shared/subscription-utils'

// Runs even while the plugin is disabled so linked subscriptions are still accurate when it is turned back on
export const subscriptionRecurringHooks: RecurringHooks = {
  async afterUpdate(recurring) {
    const subscriptions = await storage.getSubscriptions()
    const idx = subscriptions.findIndex((subscription) => subscription.recurringId === recurring.id)
    if (idx === -1) return
    const synced = applyRecurringToSubscription(subscriptions[idx], recurring, todayISO())
    subscriptions[idx] = synced ?? { ...subscriptions[idx], recurringId: undefined }
    await storage.saveSubscriptions(subscriptions)
  },

  async afterDelete(recurringId) {
    const subscriptions = await storage.getSubscriptions()
    if (!subscriptions.some((subscription) => subscription.recurringId === recurringId)) return
    await storage.saveSubscriptions(
      subscriptions.map((subscription) =>
        subscription.recurringId === recurringId ? { ...subscription, recurringId: undefined } : subscription
      )
    )
  },
}
