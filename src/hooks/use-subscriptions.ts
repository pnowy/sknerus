import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/hooks/use-expenses'
import {
  bookSubscriptionPayment,
  createSubscription,
  deleteSubscription,
  getSubscriptions,
  importRecurringSubscriptions,
  resolveExchangeRate,
  skipSubscriptionRenewal,
  updateSubscription,
} from '@/lib/api'
import type { BookPaymentInput, ImportRecurringInput, SubscriptionPayload } from '@/lib/schemas'
import { todayISO } from '@/lib/shared/date-utils'

export const subscriptionQueryKeys = {
  subscriptions: ['subscriptions'] as const,
}

export function useSubscriptions(enabled = true) {
  return useQuery({
    queryKey: subscriptionQueryKeys.subscriptions,
    queryFn: () => getSubscriptions(),
    enabled,
  })
}

// A linked subscription writes through to its recurring template, so both lists go stale together
function useInvalidateSubscriptionData() {
  const qc = useQueryClient()
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: subscriptionQueryKeys.subscriptions }),
      qc.invalidateQueries({ queryKey: queryKeys.recurring }),
      qc.invalidateQueries({ queryKey: queryKeys.expenses }),
    ])
}

export function useCreateSubscription() {
  const invalidate = useInvalidateSubscriptionData()
  return useMutation({
    mutationFn: (data: SubscriptionPayload) => createSubscription(data),
    onSuccess: invalidate,
  })
}

export function useUpdateSubscription() {
  const invalidate = useInvalidateSubscriptionData()
  return useMutation({
    mutationFn: (data: SubscriptionPayload & { id: string }) => updateSubscription(data),
    onSuccess: invalidate,
  })
}

export function useDeleteSubscription() {
  const invalidate = useInvalidateSubscriptionData()
  return useMutation({
    mutationFn: (data: { id: string; withRecurring: boolean }) => deleteSubscription(data),
    onSuccess: invalidate,
  })
}

export function useBookSubscriptionPayment() {
  const invalidate = useInvalidateSubscriptionData()
  return useMutation({
    mutationFn: (data: BookPaymentInput & { id: string }) => bookSubscriptionPayment(data),
    onSuccess: invalidate,
  })
}

export function useSkipSubscriptionRenewal() {
  const invalidate = useInvalidateSubscriptionData()
  return useMutation({
    mutationFn: (id: string) => skipSubscriptionRenewal(id),
    onSuccess: invalidate,
  })
}

export function useImportRecurringSubscriptions() {
  const invalidate = useInvalidateSubscriptionData()
  return useMutation({
    mutationFn: (data: ImportRecurringInput) => importRecurringSubscriptions(data),
    onSuccess: invalidate,
  })
}

/** Today's rate from each currency to the base currency; a currency maps to undefined until loaded or on failure */
export function useRatesToBase(currencies: Array<string>, base: string): Map<string, number | undefined> {
  const today = todayISO()
  const foreign = [...new Set(currencies)].filter((currency) => currency !== base)
  const results = useQueries({
    queries: foreign.map((from) => ({
      queryKey: ['exchange-rate', today, from, base] as const,
      queryFn: () => resolveExchangeRate({ date: today, from, to: base }),
      staleTime: Number.POSITIVE_INFINITY,
      retry: 1,
    })),
  })
  const rates = new Map<string, number | undefined>([[base, 1]])
  foreign.forEach((currency, index) => {
    rates.set(currency, results[index]?.data)
  })
  return rates
}
