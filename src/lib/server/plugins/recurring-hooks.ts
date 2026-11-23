import type { RecurringExpense } from '@/lib/shared/types/expense'

/**
 * Extension point that lets optional plugins react to recurring changes without the core knowing about them.
 * Hooks run inside the caller's write lock, so they must use storage directly and never call withWriteLock.
 */
export type RecurringHooks = {
  afterUpdate: (recurring: RecurringExpense) => Promise<void>
  afterDelete: (recurringId: string) => Promise<void>
}
