import { describe, expect, it } from 'vitest'
import {
  advanceRenewal,
  applyRecurringToSubscription,
  applySubscriptionToRecurring,
  calcMonthlyCost,
  calcPeriodCost,
  createRecurringFromSubscription,
  dueRenewals,
  formatBillingPeriod,
  isConvertibleRecurring,
  matchesFilter,
  overallPriceChange,
  paymentHistory,
  recurringPeriodMonths,
  renewalAfterPayments,
  subscriptionFromRecurring,
  subscriptionPayments,
  summarizeSubscriptions,
  yearlyTotals,
} from '@/lib/shared/subscription-utils'
import type { RecurringExpense } from '@/lib/shared/types/expense'
import { type DeductionProfile, type Subscription, SubscriptionFilter } from '@/lib/shared/types/subscription'

const profile: DeductionProfile = { id: 'ded_1', name: 'JDG', vatRate: 23, vatRecoverable: 100, incomeTaxRate: 19, extraRate: 0 }

const baseSubscription: Subscription = {
  id: 'sub_1',
  name: 'YouTube Premium',
  amount: 123,
  currency: 'PLN',
  billingPeriodMonths: 1,
  priceIncludesVat: true,
  active: true,
}

const baseRecurring: RecurringExpense = {
  id: 'rec_1',
  name: 'YouTube Premium',
  amount: -123,
  currency: 'PLN',
  categoryId: 'cat_subs',
  tags: [],
  frequency: 'monthly',
  dayOfMonth: 10,
  startDate: '2026-01-10',
}

describe('calcPeriodCost', () => {
  describe('when the subscription has no deduction profile', () => {
    it('should keep the gross price as the effective cost', () => {
      expect(calcPeriodCost(baseSubscription, undefined, 1)).toEqual({ gross: 123, vatBack: 0, taxBack: 0, effective: 123 })
    })
  })

  describe('when the profile recovers full VAT and income tax', () => {
    it('should deduct 23% VAT from the gross price and 19% tax from the net', () => {
      const cost = calcPeriodCost(baseSubscription, profile, 1)
      expect(cost.vatBack).toBeCloseTo(23)
      expect(cost.taxBack).toBeCloseTo(19)
      expect(cost.effective).toBeCloseTo(81)
    })
  })

  describe('when only half of the VAT is recoverable', () => {
    it('should add the non-recovered VAT to the income tax base', () => {
      const cost = calcPeriodCost(baseSubscription, { ...profile, vatRecoverable: 50 }, 1)
      expect(cost.vatBack).toBeCloseTo(11.5)
      expect(cost.taxBack).toBeCloseTo(111.5 * 0.19)
      expect(cost.effective).toBeCloseTo(111.5 * 0.81)
    })
  })

  describe('when the price does not include VAT', () => {
    it('should only deduct income tax', () => {
      const cost = calcPeriodCost({ ...baseSubscription, amount: 100, priceIncludesVat: false }, profile, 1)
      expect(cost.vatBack).toBe(0)
      expect(cost.effective).toBeCloseTo(81)
    })
  })

  describe('when an extra contribution rate is set', () => {
    it('should add it to the income tax rate', () => {
      const cost = calcPeriodCost({ ...baseSubscription, amount: 100, priceIncludesVat: false }, { ...profile, extraRate: 4.9 }, 1)
      expect(cost.taxBack).toBeCloseTo(23.9)
    })
  })

  describe('when the price is in a foreign currency', () => {
    it('should convert with the given rate before deducting', () => {
      const cost = calcPeriodCost({ ...baseSubscription, amount: 20, currency: 'USD' }, undefined, 4)
      expect(cost.gross).toBe(80)
    })
  })
})

describe('calcMonthlyCost', () => {
  describe('when billed yearly', () => {
    it('should spread the cost over 12 months', () => {
      const cost = calcMonthlyCost({ ...baseSubscription, amount: 1200, billingPeriodMonths: 12 }, undefined, 1)
      expect(cost.gross).toBe(100)
    })
  })
})

describe('summarizeSubscriptions', () => {
  describe('when there are active, inactive and business subscriptions', () => {
    it('should sum active ones only and count business subscriptions', () => {
      const subscriptions: Array<Subscription> = [
        baseSubscription,
        { ...baseSubscription, id: 'sub_2', deductionProfileId: 'ded_1' },
        { ...baseSubscription, id: 'sub_3', active: false },
      ]
      const summary = summarizeSubscriptions(subscriptions, [profile], () => 1)
      expect(summary.activeCount).toBe(2)
      expect(summary.businessCount).toBe(1)
      expect(summary.monthly.gross).toBeCloseTo(246)
      expect(summary.monthly.effective).toBeCloseTo(204)
      expect(summary.yearly.gross).toBeCloseTo(2952)
    })
  })

  describe('when an exchange rate is missing', () => {
    it('should skip the subscription and report it', () => {
      const summary = summarizeSubscriptions([{ ...baseSubscription, currency: 'USD' }], [], () => undefined)
      expect(summary.missingRateCount).toBe(1)
      expect(summary.monthly.gross).toBe(0)
    })
  })
})

describe('matchesFilter', () => {
  describe('when the deduction profile was deleted', () => {
    it('should treat the subscription as private', () => {
      const orphan = { ...baseSubscription, deductionProfileId: 'ded_missing' }
      expect(matchesFilter(orphan, SubscriptionFilter.Private, [profile])).toBe(true)
      expect(matchesFilter(orphan, SubscriptionFilter.Business, [profile])).toBe(false)
    })
  })

  describe('when the subscription is inactive', () => {
    it('should only match the inactive and all filters', () => {
      const inactive = { ...baseSubscription, active: false }
      expect(matchesFilter(inactive, SubscriptionFilter.Inactive, [])).toBe(true)
      expect(matchesFilter(inactive, SubscriptionFilter.All, [])).toBe(true)
      expect(matchesFilter(inactive, SubscriptionFilter.Private, [])).toBe(false)
    })
  })
})

describe('formatBillingPeriod', () => {
  it('should name common periods', () => {
    expect([1, 3, 12, 24].map(formatBillingPeriod)).toEqual(['Monthly', 'Every 3 months', 'Yearly', 'Every 2 years'])
  })
})

describe('recurringPeriodMonths', () => {
  describe('when the recurring is monthly or yearly with an interval', () => {
    it('should return the period in months', () => {
      expect(recurringPeriodMonths({ ...baseRecurring, interval: 3 })).toBe(3)
      expect(recurringPeriodMonths({ ...baseRecurring, frequency: 'yearly', interval: 2 })).toBe(24)
    })
  })

  describe('when the recurring is weekly', () => {
    it('should not be convertible', () => {
      const weekly = { ...baseRecurring, frequency: 'weekly' as const }
      expect(recurringPeriodMonths(weekly)).toBeUndefined()
      expect(isConvertibleRecurring(weekly)).toBe(false)
    })
  })

  describe('when the recurring is income', () => {
    it('should not be convertible', () => {
      expect(isConvertibleRecurring({ ...baseRecurring, amount: 100 })).toBe(false)
    })
  })
})

describe('createRecurringFromSubscription', () => {
  describe('when the period is 3 months', () => {
    it('should create a negative monthly recurring with interval 3 on the start day', () => {
      const recurring = createRecurringFromSubscription(
        { ...baseSubscription, billingPeriodMonths: 3, categoryId: 'cat_subs' },
        '2026-02-15'
      )
      expect(recurring).toMatchObject({ amount: -123, frequency: 'monthly', interval: 3, dayOfMonth: 15, startDate: '2026-02-15' })
    })
  })

  describe('when the period is 12 months', () => {
    it('should create a yearly recurring in the start month', () => {
      const recurring = createRecurringFromSubscription(
        { ...baseSubscription, billingPeriodMonths: 12, categoryId: 'cat_subs' },
        '2026-05-03'
      )
      expect(recurring).toMatchObject({ frequency: 'yearly', interval: 1, month: 5, dayOfMonth: 3 })
    })
  })
})

describe('applySubscriptionToRecurring', () => {
  const linked: Subscription = { ...baseSubscription, categoryId: 'cat_subs', recurringId: 'rec_1' }

  describe('when only the price changes', () => {
    it('should update the amount and keep the schedule', () => {
      const next = applySubscriptionToRecurring(baseRecurring, { ...linked, amount: 130 }, '2026-06-01')
      expect(next.amount).toBe(-130)
      expect(next.startDate).toBe('2026-01-10')
    })
  })

  describe('when the billing period changes', () => {
    it('should restart the schedule from today on the same payment day', () => {
      const next = applySubscriptionToRecurring(baseRecurring, { ...linked, billingPeriodMonths: 3 }, '2026-06-01')
      expect(next).toMatchObject({ frequency: 'monthly', interval: 3, startDate: '2026-06-01', dayOfMonth: 10 })
    })
  })

  describe('when the subscription is deactivated', () => {
    it('should end the recurring today', () => {
      const next = applySubscriptionToRecurring(baseRecurring, { ...linked, active: false }, '2026-06-01')
      expect(next.endDate).toBe('2026-06-01')
    })
  })

  describe('when an ended subscription is reactivated', () => {
    it('should clear the end date and restart from today so missed months are not backfilled', () => {
      const ended = { ...baseRecurring, endDate: '2026-03-01' }
      const next = applySubscriptionToRecurring(ended, linked, '2026-06-01')
      expect(next.endDate).toBeUndefined()
      expect(next.startDate).toBe('2026-06-01')
    })
  })

  describe('when an ended yearly subscription is reactivated', () => {
    it('should anchor the yearly payment on the restart date so this year is not skipped', () => {
      const ended: RecurringExpense = { ...baseRecurring, frequency: 'yearly', month: 1, endDate: '2026-02-01' }
      const next = applySubscriptionToRecurring(ended, { ...linked, billingPeriodMonths: 12 }, '2026-06-20')
      expect(next).toMatchObject({ frequency: 'yearly', startDate: '2026-06-20', month: 6, dayOfMonth: 20 })
    })
  })

  describe('when a monthly subscription becomes yearly', () => {
    it('should start the yearly cadence from today', () => {
      const next = applySubscriptionToRecurring(baseRecurring, { ...linked, billingPeriodMonths: 12 }, '2026-06-20')
      expect(next).toMatchObject({ frequency: 'yearly', interval: 1, month: 6, dayOfMonth: 20 })
    })
  })
})

describe('applyRecurringToSubscription', () => {
  describe('when the recurring changes price and period', () => {
    it('should mirror them on the subscription', () => {
      const next = applyRecurringToSubscription(baseSubscription, { ...baseRecurring, amount: -50, frequency: 'yearly' }, '2026-06-01')
      expect(next).toMatchObject({ amount: 50, billingPeriodMonths: 12, categoryId: 'cat_subs', active: true })
    })
  })

  describe('when the recurring has ended', () => {
    it('should mark the subscription inactive', () => {
      const next = applyRecurringToSubscription(baseSubscription, { ...baseRecurring, endDate: '2026-05-01' }, '2026-06-01')
      expect(next?.active).toBe(false)
    })
  })

  describe('when the recurring becomes weekly', () => {
    it('should return undefined so the link is dropped', () => {
      expect(applyRecurringToSubscription(baseSubscription, { ...baseRecurring, frequency: 'weekly' }, '2026-06-01')).toBeUndefined()
    })
  })
})

describe('subscriptionFromRecurring', () => {
  describe('when importing a monthly expense', () => {
    it('should create a linked subscription with a positive amount', () => {
      const subscription = subscriptionFromRecurring(baseRecurring, 'ded_1', '2026-06-01')
      expect(subscription).toMatchObject({ amount: 123, billingPeriodMonths: 1, recurringId: 'rec_1', deductionProfileId: 'ded_1' })
    })
  })
})

describe('advanceRenewal', () => {
  describe('when the period is yearly', () => {
    it('should move the date one year ahead', () => {
      expect(advanceRenewal('2026-05-14', 12)).toBe('2027-05-14')
    })
  })

  describe('when the target month is shorter', () => {
    it('should clamp to the last day of the month', () => {
      expect(advanceRenewal('2026-01-31', 1)).toBe('2026-02-28')
    })
  })

  describe('when the renewal is at month end', () => {
    it('should stay at month end instead of drifting to an earlier day', () => {
      expect(advanceRenewal('2026-02-28', 1)).toBe('2026-03-31')
      expect(advanceRenewal('2026-04-30', 1)).toBe('2026-05-31')
    })
  })

  describe('when the renewal is mid-month', () => {
    it('should keep the same day', () => {
      expect(advanceRenewal('2026-03-30', 1)).toBe('2026-04-30')
      expect(advanceRenewal('2026-04-30', 2)).toBe('2026-06-30')
    })
  })
})

describe('renewalAfterPayments', () => {
  describe('when there are payments', () => {
    it('should count one period from the latest payment', () => {
      expect(renewalAfterPayments([{ date: '2025-05-10' }, { date: '2026-05-14' }, { date: '2024-05-02' }], 12)).toBe('2027-05-14')
    })
  })

  describe('when there are no payments', () => {
    it('should return undefined', () => {
      expect(renewalAfterPayments([], 12)).toBeUndefined()
    })
  })
})

describe('dueRenewals', () => {
  const manual = (overrides: Partial<Subscription>): Subscription => ({ ...baseSubscription, billingPeriodMonths: 12, ...overrides })

  describe('when manual renewals are near, overdue or far away', () => {
    it('should return only those within the due window, oldest first', () => {
      const result = dueRenewals(
        [
          manual({ id: 'far', nextRenewal: '2026-07-01' }),
          manual({ id: 'soon', nextRenewal: '2026-06-08' }),
          manual({ id: 'overdue', nextRenewal: '2026-05-14' }),
        ],
        '2026-06-01'
      )
      expect(result.map((due) => [due.subscription.id, due.daysLeft])).toEqual([
        ['overdue', -18],
        ['soon', 7],
      ])
    })
  })

  describe('when a subscription is inactive, linked to a recurring transaction or has no date', () => {
    it('should skip it', () => {
      const result = dueRenewals(
        [
          manual({ id: 'inactive', active: false, nextRenewal: '2026-06-01' }),
          manual({ id: 'linked', recurringId: 'rec_1', nextRenewal: '2026-06-01' }),
          manual({ id: 'undated' }),
        ],
        '2026-06-01'
      )
      expect(result).toEqual([])
    })
  })
})

describe('subscriptionPayments', () => {
  const expense = (id: string, recurringId?: string) => ({
    id,
    name: 'x',
    amount: -1,
    currency: 'PLN',
    categoryId: 'cat_1',
    date: '2026-01-01',
    tags: [],
    recurringId,
  })

  describe('when payments are linked manually and booked by the recurring template', () => {
    it('should include both and ignore unrelated transactions', () => {
      const subscription = { ...baseSubscription, recurringId: 'rec_1', paymentIds: ['exp_manual', 'exp_deleted'] }
      const result = subscriptionPayments(subscription, [expense('exp_manual'), expense('exp_auto', 'rec_1'), expense('exp_other')])
      expect(result.map((item) => item.id)).toEqual(['exp_manual', 'exp_auto'])
    })
  })
})

describe('payment statistics', () => {
  const payment = (id: string, date: string, amount: number, original?: { amount: number; currency: string }) => ({
    id,
    name: 'Orange Flex',
    amount: -amount,
    currency: 'PLN',
    categoryId: 'cat_1',
    date,
    tags: [],
    originalAmount: original ? -original.amount : undefined,
    originalCurrency: original?.currency,
  })

  describe('paymentHistory', () => {
    describe('when the price changes between payments', () => {
      it('should sort oldest first and compute the change vs the previous payment', () => {
        const history = paymentHistory([payment('b', '2025-05-14', 330), payment('a', '2024-05-14', 300)])
        expect(history.map((row) => row.id)).toEqual(['a', 'b'])
        expect(history[0].change).toBeUndefined()
        expect(history[1].change).toBeCloseTo(0.1)
      })
    })

    describe('when the currency switches', () => {
      it('should use the entered amount and skip the change', () => {
        const history = paymentHistory([payment('a', '2024-01-01', 300), payment('b', '2025-01-01', 200, { amount: 50, currency: 'USD' })])
        expect(history[1]).toMatchObject({ price: 50, currency: 'USD', base: 200, change: undefined })
      })
    })
  })

  describe('yearlyTotals', () => {
    describe('when a year has no payments', () => {
      it('should include it with a zero total', () => {
        const history = paymentHistory([payment('a', '2023-05-01', 100), payment('b', '2025-05-01', 120), payment('c', '2025-11-01', 30)])
        expect(yearlyTotals(history)).toEqual([
          { year: '2023', total: 100, count: 1 },
          { year: '2024', total: 0, count: 0 },
          { year: '2025', total: 150, count: 2 },
        ])
      })
    })
  })

  describe('overallPriceChange', () => {
    describe('when there are several payments in one currency', () => {
      it('should compare the latest payment with the first', () => {
        const history = paymentHistory([payment('a', '2023-05-01', 200), payment('b', '2024-05-01', 220), payment('c', '2025-05-01', 250)])
        expect(overallPriceChange(history)).toBeCloseTo(0.25)
      })
    })

    describe('when there is a single payment', () => {
      it('should return undefined', () => {
        expect(overallPriceChange(paymentHistory([payment('a', '2023-05-01', 200)]))).toBeUndefined()
      })
    })
  })
})
