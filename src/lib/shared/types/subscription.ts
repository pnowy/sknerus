/**
 * Tax treatment applied to business subscriptions. All rates are percentages (23 = 23%),
 * so the same model covers e.g. Polish VAT + PIT, a flat-rate regime (incomeTaxRate 0) or VAT-only setups.
 */
export type DeductionProfile = {
  id: string
  name: string
  /** VAT rate included in gross prices */
  vatRate: number
  /** Share of VAT that is recovered (100 = full, 50 = half, 0 = none) */
  vatRecoverable: number
  /** Income tax rate the cost reduces */
  incomeTaxRate: number
  /** Additional contribution reduced by the cost, e.g. a health insurance rate */
  extraRate: number
}

export type Subscription = {
  id: string
  name: string
  /** Positive price per billing period, in `currency` */
  amount: number
  currency: string
  billingPeriodMonths: number
  /** Missing = private subscription */
  deductionProfileId?: string
  /** False for invoices without VAT, e.g. reverse-charge services from abroad */
  priceIncludesVat: boolean
  active: boolean
  categoryId?: string
  /** Next payment due for manually paid subscriptions; linked ones derive it from the recurring schedule */
  nextRenewal?: string
  url?: string
  notes?: string
  /** Linked recurring transaction that books the payments */
  recurringId?: string
  /** Manually booked transactions paying for this subscription; ids of deleted transactions are ignored */
  paymentIds?: Array<string>
}

export const SubscriptionFilter = {
  All: 'all',
  Private: 'private',
  Business: 'business',
  Inactive: 'inactive',
} as const
export type SubscriptionFilter = (typeof SubscriptionFilter)[keyof typeof SubscriptionFilter]

/** How the subscription form relates to transactions: manual payments or a recurring transaction */
export const RecurringLinkMode = {
  Manual: 'manual',
  Create: 'create',
  Existing: 'existing',
} as const
export type RecurringLinkMode = (typeof RecurringLinkMode)[keyof typeof RecurringLinkMode]
