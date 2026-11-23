import { addMonths, differenceInCalendarDays, format, parseISO } from 'date-fns'
import type { Expense, RecurringExpense } from '@/lib/shared/types/expense'
import { type DeductionProfile, type Subscription, SubscriptionFilter } from '@/lib/shared/types/subscription'

export type CostBreakdown = {
  gross: number
  vatBack: number
  taxBack: number
  effective: number
}

const ZERO_BREAKDOWN: CostBreakdown = { gross: 0, vatBack: 0, taxBack: 0, effective: 0 }

/**
 * Cost of one billing period in the base currency.
 * Non-recovered VAT is part of the cost, so it also lowers the income tax base.
 */
export function calcPeriodCost(subscription: Subscription, profile: DeductionProfile | undefined, rate: number): CostBreakdown {
  const gross = subscription.amount * rate
  if (!profile) return { gross, vatBack: 0, taxBack: 0, effective: gross }

  const net = subscription.priceIncludesVat ? gross / (1 + profile.vatRate / 100) : gross
  const vatBack = (gross - net) * (profile.vatRecoverable / 100)
  const taxBack = (gross - vatBack) * ((profile.incomeTaxRate + profile.extraRate) / 100)
  return { gross, vatBack, taxBack, effective: gross - vatBack - taxBack }
}

export function calcMonthlyCost(subscription: Subscription, profile: DeductionProfile | undefined, rate: number): CostBreakdown {
  const period = calcPeriodCost(subscription, profile, rate)
  const months = Math.max(1, subscription.billingPeriodMonths)
  return {
    gross: period.gross / months,
    vatBack: period.vatBack / months,
    taxBack: period.taxBack / months,
    effective: period.effective / months,
  }
}

export function findProfile(profiles: Array<DeductionProfile>, id: string | undefined): DeductionProfile | undefined {
  return id ? profiles.find((profile) => profile.id === id) : undefined
}

/** A subscription whose profile was deleted is treated as private */
export function isBusiness(subscription: Subscription, profiles: Array<DeductionProfile>): boolean {
  return !!findProfile(profiles, subscription.deductionProfileId)
}

export type SubscriptionSummary = {
  monthly: CostBreakdown
  yearly: CostBreakdown
  activeCount: number
  businessCount: number
  /** Active subscriptions skipped because their exchange rate is unknown */
  missingRateCount: number
}

export function summarizeSubscriptions(
  subscriptions: Array<Subscription>,
  profiles: Array<DeductionProfile>,
  rateFor: (currency: string) => number | undefined
): SubscriptionSummary {
  const monthly = { ...ZERO_BREAKDOWN }
  let activeCount = 0
  let businessCount = 0
  let missingRateCount = 0

  for (const subscription of subscriptions) {
    if (!subscription.active) continue
    activeCount++
    const profile = findProfile(profiles, subscription.deductionProfileId)
    if (profile) businessCount++
    const rate = rateFor(subscription.currency)
    if (rate === undefined) {
      missingRateCount++
      continue
    }
    const cost = calcMonthlyCost(subscription, profile, rate)
    monthly.gross += cost.gross
    monthly.vatBack += cost.vatBack
    monthly.taxBack += cost.taxBack
    monthly.effective += cost.effective
  }

  const yearly = {
    gross: monthly.gross * 12,
    vatBack: monthly.vatBack * 12,
    taxBack: monthly.taxBack * 12,
    effective: monthly.effective * 12,
  }
  return { monthly, yearly, activeCount, businessCount, missingRateCount }
}

export function matchesFilter(subscription: Subscription, filter: SubscriptionFilter, profiles: Array<DeductionProfile>): boolean {
  switch (filter) {
    case SubscriptionFilter.All:
      return true
    case SubscriptionFilter.Inactive:
      return !subscription.active
    case SubscriptionFilter.Business:
      return subscription.active && isBusiness(subscription, profiles)
    case SubscriptionFilter.Private:
      return subscription.active && !isBusiness(subscription, profiles)
  }
}

export function formatBillingPeriod(months: number): string {
  if (months === 1) return 'Monthly'
  if (months === 12) return 'Yearly'
  if (months % 12 === 0) return `Every ${months / 12} years`
  return `Every ${months} months`
}

/** Billing period in months, or undefined for daily/weekly schedules that don't map to a subscription */
export function recurringPeriodMonths(recurring: RecurringExpense): number | undefined {
  const interval = Math.max(1, recurring.interval ?? 1)
  if (recurring.frequency === 'monthly') return interval
  if (recurring.frequency === 'yearly') return interval * 12
  return undefined
}

export function isConvertibleRecurring(recurring: RecurringExpense): boolean {
  return recurringPeriodMonths(recurring) !== undefined && recurring.amount < 0
}

type RecurringSchedule = Pick<RecurringExpense, 'frequency' | 'interval' | 'dayOfMonth' | 'month'>

/** Schedule for a billing period, anchored to the day (and month for yearly periods) of `startDate` */
export function scheduleForPeriod(billingPeriodMonths: number, startDate: string): RecurringSchedule {
  const start = parseISO(startDate)
  if (billingPeriodMonths % 12 === 0) {
    return { frequency: 'yearly', interval: billingPeriodMonths / 12, dayOfMonth: start.getDate(), month: start.getMonth() + 1 }
  }
  return { frequency: 'monthly', interval: billingPeriodMonths, dayOfMonth: start.getDate(), month: undefined }
}

export function createRecurringFromSubscription(subscription: Subscription, startDate: string): Omit<RecurringExpense, 'id'> {
  if (!subscription.categoryId) throw new Error('A category is required to create a recurring transaction')
  return {
    name: subscription.name,
    amount: -Math.abs(subscription.amount),
    currency: subscription.currency,
    categoryId: subscription.categoryId,
    tags: [],
    startDate,
    ...scheduleForPeriod(subscription.billingPeriodMonths, startDate),
  }
}

/**
 * Pushes the shared fields of a subscription onto its linked recurring transaction.
 * Schedule changes and re-activation restart the template from today, otherwise
 * materialization would backfill payments for months that were never billed.
 */
export function applySubscriptionToRecurring(recurring: RecurringExpense, subscription: Subscription, today: string): RecurringExpense {
  const next: RecurringExpense = {
    ...recurring,
    name: subscription.name,
    amount: -Math.abs(subscription.amount),
    currency: subscription.currency,
    categoryId: subscription.categoryId ?? recurring.categoryId,
  }

  const isEnded = !!recurring.endDate && recurring.endDate <= today
  const periodChanged = recurringPeriodMonths(recurring) !== subscription.billingPeriodMonths
  const restart = periodChanged || (subscription.active && isEnded)

  if (restart) {
    const schedule = scheduleForPeriod(subscription.billingPeriodMonths, today)
    const originalStart = parseISO(recurring.startDate)
    next.startDate = recurring.startDate > today ? recurring.startDate : today
    next.frequency = schedule.frequency
    next.interval = schedule.interval
    // keep the original payment day so the cadence stays on the same day of month
    next.dayOfMonth = recurring.dayOfMonth ?? originalStart.getDate()
    next.month = schedule.frequency === 'yearly' ? (recurring.month ?? originalStart.getMonth() + 1) : undefined
    next.dayOfWeek = undefined
  }

  if (!subscription.active) {
    next.endDate = recurring.endDate && recurring.endDate < today ? recurring.endDate : today
  } else if (isEnded) {
    next.endDate = undefined
  }
  return next
}

/** Mirrors an edited recurring transaction onto its subscription; undefined means the link can no longer hold */
export function applyRecurringToSubscription(
  subscription: Subscription,
  recurring: RecurringExpense,
  today: string
): Subscription | undefined {
  const months = recurringPeriodMonths(recurring)
  if (months === undefined || recurring.amount >= 0) return undefined
  return {
    ...subscription,
    name: recurring.name,
    amount: Math.abs(recurring.amount),
    currency: recurring.currency,
    categoryId: recurring.categoryId,
    billingPeriodMonths: months,
    active: !(recurring.endDate && recurring.endDate <= today),
  }
}

export function subscriptionFromRecurring(
  recurring: RecurringExpense,
  deductionProfileId: string | undefined,
  today: string
): Omit<Subscription, 'id'> | undefined {
  const months = recurringPeriodMonths(recurring)
  if (months === undefined || recurring.amount >= 0) return undefined
  return {
    name: recurring.name,
    amount: Math.abs(recurring.amount),
    currency: recurring.currency,
    billingPeriodMonths: months,
    categoryId: recurring.categoryId,
    deductionProfileId,
    priceIncludesVat: true,
    active: !(recurring.endDate && recurring.endDate <= today),
    notes: recurring.notes,
    recurringId: recurring.id,
  }
}

/** Days before the renewal date when a manually paid subscription asks to be booked */
export const RENEWAL_DUE_DAYS = 7

/** Longer billing periods get a gentle heads-up this many days before renewal, to decide on cancelling in time */
export const RENEWAL_NOTICE_DAYS = 30

export function advanceRenewal(date: string, billingPeriodMonths: number): string {
  return format(addMonths(parseISO(date), Math.max(1, billingPeriodMonths)), 'yyyy-MM-dd')
}

/** Next renewal implied by the most recent payment, or undefined without payments */
export function renewalAfterPayments(payments: Array<Pick<Expense, 'date'>>, billingPeriodMonths: number): string | undefined {
  const latest = payments.reduce<string | undefined>((max, payment) => (!max || payment.date > max ? payment.date : max), undefined)
  return latest ? advanceRenewal(latest, billingPeriodMonths) : undefined
}

export type DueRenewal = {
  subscription: Subscription
  date: string
  /** Negative once the renewal date has passed */
  daysLeft: number
}

/**
 * Manually paid subscriptions whose renewal is within RENEWAL_DUE_DAYS or overdue. They stay due until
 * the user books, skips or ends them — nothing rolls forward on its own.
 */
export function dueRenewals(subscriptions: Array<Subscription>, today: string): Array<DueRenewal> {
  return subscriptions
    .flatMap((subscription) => {
      if (!subscription.active || subscription.recurringId || !subscription.nextRenewal) return []
      const daysLeft = differenceInCalendarDays(parseISO(subscription.nextRenewal), parseISO(today))
      return daysLeft <= RENEWAL_DUE_DAYS ? [{ subscription, date: subscription.nextRenewal, daysLeft }] : []
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Transactions paying for a subscription: booked by its recurring template or linked manually */
export function subscriptionPayments(subscription: Subscription, expenses: Array<Expense>): Array<Expense> {
  const linked = new Set(subscription.paymentIds ?? [])
  return expenses.filter(
    (expense) => linked.has(expense.id) || (!!subscription.recurringId && expense.recurringId === subscription.recurringId)
  )
}

export type PaymentHistoryRow = {
  id: string
  date: string
  /** Paid amount in the currency it was entered in */
  price: number
  currency: string
  /** Paid amount in the base currency */
  base: number
  /** Relative change vs the previous payment (0.1 = +10%); undefined for the first one or after a currency switch */
  change?: number
}

/** Payments oldest first, with the price change between consecutive payments */
export function paymentHistory(payments: Array<Expense>): Array<PaymentHistoryRow> {
  const sorted = [...payments].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.map((payment, index) => {
    const price = Math.abs(payment.originalAmount ?? payment.amount)
    const currency = payment.originalCurrency ?? payment.currency
    const previous = sorted[index - 1]
    const previousPrice = previous && Math.abs(previous.originalAmount ?? previous.amount)
    const sameCurrency = previous && (previous.originalCurrency ?? previous.currency) === currency
    return {
      id: payment.id,
      date: payment.date,
      price,
      currency,
      base: Math.abs(payment.amount),
      change: sameCurrency && previousPrice ? price / previousPrice - 1 : undefined,
    }
  })
}

/** Base-currency totals per calendar year, including empty years between the first and last payment */
export function yearlyTotals(history: Array<PaymentHistoryRow>): Array<{ year: string; total: number; count: number }> {
  if (history.length === 0) return []
  const byYear = new Map<number, { total: number; count: number }>()
  for (const row of history) {
    const year = Number(row.date.slice(0, 4))
    const entry = byYear.get(year) ?? { total: 0, count: 0 }
    byYear.set(year, { total: entry.total + row.base, count: entry.count + 1 })
  }
  const years = [...byYear.keys()]
  const result = []
  for (let year = Math.min(...years); year <= Math.max(...years); year++) {
    result.push({ year: String(year), ...(byYear.get(year) ?? { total: 0, count: 0 }) })
  }
  return result
}

/** Change from the first to the latest payment, only when both were paid in the same currency */
export function overallPriceChange(history: Array<PaymentHistoryRow>): number | undefined {
  const first = history[0]
  const last = history[history.length - 1]
  if (!first || !last || first === last || first.currency !== last.currency || first.price === 0) return undefined
  return last.price / first.price - 1
}
