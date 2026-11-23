import type { BookPaymentInput, SubscriptionPayload } from '@/lib/schemas'
import { genExpenseId, genRecurringId, genSubscriptionId } from '@/lib/server/ids.server'
import { BadRequestError, NotFoundError } from '@/lib/server/services/errors'
import { resolveExchangeRate } from '@/lib/server/services/exchange-rates.service'
import { withWriteLock } from '@/lib/server/services/lock'
import { storage } from '@/lib/server/storage'
import { todayISO } from '@/lib/shared/date-utils'
import {
  advanceRenewal,
  applySubscriptionToRecurring,
  createRecurringFromSubscription,
  isConvertibleRecurring,
  subscriptionFromRecurring,
} from '@/lib/shared/subscription-utils'
import type { Config, Expense, RecurringExpense } from '@/lib/shared/types/expense'
import type { Subscription } from '@/lib/shared/types/subscription'

async function requireEnabled(): Promise<Config> {
  const config = await storage.getConfig()
  if (!config.features?.subscriptionTracking) throw new NotFoundError('Subscription tracking is disabled')
  return config
}

function validateReferences(subscription: Omit<Subscription, 'id'>, config: Config) {
  if (subscription.categoryId && !config.categories.some((category) => category.id === subscription.categoryId)) {
    throw new BadRequestError('Unknown category')
  }
  if (subscription.deductionProfileId && !config.deductionProfiles?.some((profile) => profile.id === subscription.deductionProfileId)) {
    throw new BadRequestError('Unknown deduction profile')
  }
}

/** Drops ids of deleted transactions and rejects transactions already paying for another subscription */
function syncPayments(subscription: Subscription, subscriptions: Array<Subscription>, expenses: Array<Expense>): Subscription {
  if (!subscription.paymentIds?.length) return { ...subscription, paymentIds: undefined }
  const existing = new Set(expenses.map((expense) => expense.id))
  const paymentIds = [...new Set(subscription.paymentIds)].filter((id) => existing.has(id))
  const takenElsewhere = new Set(subscriptions.filter((other) => other.id !== subscription.id).flatMap((other) => other.paymentIds ?? []))
  if (paymentIds.some((id) => takenElsewhere.has(id))) throw new BadRequestError('A transaction is already linked to another subscription')
  return { ...subscription, paymentIds: paymentIds.length > 0 ? paymentIds : undefined }
}

/**
 * Applies the payload's link intent (keep / link existing / create new) and pushes shared fields to the
 * linked recurring transaction. Returns the final subscription and the next recurring list.
 */
function syncLink(
  subscription: Subscription,
  schedule: SubscriptionPayload['schedule'],
  subscriptions: Array<Subscription>,
  recurring: Array<RecurringExpense>,
  today: string
): { subscription: Subscription; recurring: Array<RecurringExpense> } {
  if (schedule && !subscription.recurringId) {
    if (!subscription.categoryId) throw new BadRequestError('A category is required to create a recurring transaction')
    const created: RecurringExpense = { ...createRecurringFromSubscription(subscription, schedule.startDate), id: genRecurringId() }
    return { subscription: { ...subscription, recurringId: created.id }, recurring: [...recurring, created] }
  }

  if (!subscription.recurringId) return { subscription, recurring }

  const idx = recurring.findIndex((item) => item.id === subscription.recurringId)
  if (idx === -1) throw new BadRequestError('Linked recurring transaction not found')
  const linkedElsewhere = subscriptions.some((other) => other.id !== subscription.id && other.recurringId === subscription.recurringId)
  if (linkedElsewhere) throw new BadRequestError('Recurring transaction is already linked to another subscription')
  if (!isConvertibleRecurring(recurring[idx])) throw new BadRequestError('Only monthly or yearly expenses can be linked')
  if (!subscription.categoryId) throw new BadRequestError('A category is required for linked subscriptions')

  const next = [...recurring]
  next[idx] = applySubscriptionToRecurring(recurring[idx], subscription, today)
  return { subscription, recurring: next }
}

export async function listSubscriptions(): Promise<Array<Subscription>> {
  await requireEnabled()
  return storage.getSubscriptions()
}

export function createSubscription({ schedule, ...data }: SubscriptionPayload): Promise<Subscription> {
  return withWriteLock(async () => {
    const config = await requireEnabled()
    validateReferences(data, config)
    const [subscriptions, recurring, expenses] = await Promise.all([
      storage.getSubscriptions(),
      storage.getRecurring(),
      storage.getExpenses(),
    ])

    const withPayments = syncPayments({ ...data, id: genSubscriptionId() }, subscriptions, expenses)
    const synced = syncLink(withPayments, schedule, subscriptions, recurring, todayISO())
    if (synced.recurring !== recurring) await storage.saveRecurring(synced.recurring)
    await storage.saveSubscriptions([...subscriptions, synced.subscription])
    return synced.subscription
  })
}

export function updateSubscription(id: string, { schedule, ...data }: SubscriptionPayload): Promise<Subscription> {
  return withWriteLock(async () => {
    const config = await requireEnabled()
    validateReferences(data, config)
    const [subscriptions, recurring, expenses] = await Promise.all([
      storage.getSubscriptions(),
      storage.getRecurring(),
      storage.getExpenses(),
    ])
    const idx = subscriptions.findIndex((subscription) => subscription.id === id)
    if (idx === -1) throw new NotFoundError('Subscription not found')

    const withPayments = syncPayments({ ...data, id }, subscriptions, expenses)
    const synced = syncLink(withPayments, schedule, subscriptions, recurring, todayISO())
    if (synced.recurring !== recurring) await storage.saveRecurring(synced.recurring)
    const next = [...subscriptions]
    next[idx] = synced.subscription
    await storage.saveSubscriptions(next)
    return synced.subscription
  })
}

export function removeSubscription(id: string, withRecurring: boolean): Promise<{ success: true }> {
  return withWriteLock(async () => {
    await requireEnabled()
    const subscriptions = await storage.getSubscriptions()
    const subscription = subscriptions.find((item) => item.id === id)
    if (!subscription) throw new NotFoundError('Subscription not found')

    // Already booked transactions keep their recurringId; only the template goes away
    if (withRecurring && subscription.recurringId) {
      const recurring = await storage.getRecurring()
      await storage.saveRecurring(recurring.filter((item) => item.id !== subscription.recurringId))
    }
    await storage.saveSubscriptions(subscriptions.filter((item) => item.id !== id))
    return { success: true }
  })
}

export function importFromRecurring(recurringIds: Array<string>, deductionProfileId?: string): Promise<{ created: number }> {
  return withWriteLock(async () => {
    const config = await requireEnabled()
    if (deductionProfileId && !config.deductionProfiles?.some((profile) => profile.id === deductionProfileId)) {
      throw new BadRequestError('Unknown deduction profile')
    }
    const [subscriptions, recurring] = await Promise.all([storage.getSubscriptions(), storage.getRecurring()])
    const linked = new Set(subscriptions.map((subscription) => subscription.recurringId).filter(Boolean))
    const today = todayISO()

    const created: Array<Subscription> = []
    for (const id of new Set(recurringIds)) {
      const template = recurring.find((item) => item.id === id)
      if (!template || linked.has(id)) continue
      const data = subscriptionFromRecurring(template, deductionProfileId, today)
      if (data) created.push({ ...data, id: genSubscriptionId() })
    }
    if (created.length > 0) await storage.saveSubscriptions([...subscriptions, ...created])
    return { created: created.length }
  })
}

function requireManual(subscription: Subscription | undefined): Subscription {
  if (!subscription) throw new NotFoundError('Subscription not found')
  if (subscription.recurringId) throw new BadRequestError('Payments of this subscription are booked by its recurring transaction')
  return subscription
}

/** Books one renewal as a transaction, links it and moves the renewal date one billing period ahead */
export async function bookPayment(id: string, input: BookPaymentInput): Promise<{ subscription: Subscription; expense: Expense }> {
  const config = await requireEnabled()
  if (!config.categories.some((category) => category.id === input.categoryId)) throw new BadRequestError('Unknown category')
  const current = requireManual((await storage.getSubscriptions()).find((item) => item.id === id))
  // fetched before taking the lock: a provider call can be slow and the rate cache doesn't need it
  const rate = await resolveExchangeRate(input.date, current.currency, config.currency)

  return withWriteLock(async () => {
    const [subscriptions, expenses] = await Promise.all([storage.getSubscriptions(), storage.getExpenses()])
    const idx = subscriptions.findIndex((item) => item.id === id)
    const subscription = requireManual(subscriptions[idx])

    const signed = -Math.abs(input.amount)
    const foreign = subscription.currency !== config.currency
    const expense: Expense = {
      id: genExpenseId(),
      name: subscription.name,
      amount: foreign ? signed * rate : signed,
      currency: config.currency,
      ...(foreign ? { originalAmount: signed, originalCurrency: subscription.currency } : {}),
      categoryId: input.categoryId,
      date: input.date,
      tags: [],
    }
    const updated: Subscription = {
      ...subscription,
      amount: input.updatePrice ? input.amount : subscription.amount,
      categoryId: subscription.categoryId ?? input.categoryId,
      paymentIds: [...(subscription.paymentIds ?? []), expense.id],
      nextRenewal: advanceRenewal(subscription.nextRenewal ?? input.date, subscription.billingPeriodMonths),
    }

    await storage.saveExpenses([...expenses, expense])
    const next = [...subscriptions]
    next[idx] = updated
    await storage.saveSubscriptions(next)
    return { subscription: updated, expense }
  })
}

/** Skips one renewal without booking anything */
export function skipRenewal(id: string): Promise<Subscription> {
  return withWriteLock(async () => {
    await requireEnabled()
    const subscriptions = await storage.getSubscriptions()
    const idx = subscriptions.findIndex((item) => item.id === id)
    const subscription = requireManual(subscriptions[idx])
    if (!subscription.nextRenewal) throw new BadRequestError('Subscription has no renewal date')

    const updated = { ...subscription, nextRenewal: advanceRenewal(subscription.nextRenewal, subscription.billingPeriodMonths) }
    const next = [...subscriptions]
    next[idx] = updated
    await storage.saveSubscriptions(next)
    return updated
  })
}
