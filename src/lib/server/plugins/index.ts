import type { RecurringHooks } from '@/lib/server/plugins/recurring-hooks'
import { subscriptionRecurringHooks } from '@/lib/server/services/subscriptions.hooks'
import type { RecurringExpense } from '@/lib/shared/types/expense'

const recurringHooks: Array<RecurringHooks> = [subscriptionRecurringHooks]

export async function runRecurringUpdated(recurring: RecurringExpense): Promise<void> {
  for (const hooks of recurringHooks) await hooks.afterUpdate(recurring)
}

export async function runRecurringDeleted(recurringId: string): Promise<void> {
  for (const hooks of recurringHooks) await hooks.afterDelete(recurringId)
}
