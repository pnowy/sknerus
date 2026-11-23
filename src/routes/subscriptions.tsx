import { createFileRoute, redirect } from '@tanstack/react-router'
import { Download, Plus } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { AppLayout } from '@/components/layout/app-layout'
import { BookPaymentDialog } from '@/components/subscriptions/book-payment-dialog'
import { DeleteSubscriptionDialog } from '@/components/subscriptions/delete-subscription-dialog'
import { ImportRecurringDialog } from '@/components/subscriptions/import-recurring-dialog'
import { RenewalsDue } from '@/components/subscriptions/renewals-due'
import { SubscriptionFormDialog } from '@/components/subscriptions/subscription-form-dialog'
import { SubscriptionList } from '@/components/subscriptions/subscription-list'
import { SubscriptionSummary } from '@/components/subscriptions/subscription-summary'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useConfig, useExpenses, useRecurring } from '@/hooks/use-expenses'
import { useRatesToBase, useSubscriptions } from '@/hooks/use-subscriptions'
import { getConfig, getExpenses, getRecurring, getSubscriptions } from '@/lib/api'
import { todayISO } from '@/lib/shared/date-utils'
import { dueRenewals, summarizeSubscriptions } from '@/lib/shared/subscription-utils'
import type { Subscription } from '@/lib/shared/types/subscription'

export const Route = createFileRoute('/subscriptions')({
  validateSearch: z.object({ highlight: z.string().optional() }),
  loader: async ({ context: { queryClient } }) => {
    const config = await queryClient.ensureQueryData({ queryKey: ['config'], queryFn: () => getConfig() })
    if (!config.features?.subscriptionTracking) throw redirect({ to: '/settings' })
    await Promise.all([
      queryClient.ensureQueryData({ queryKey: ['subscriptions'], queryFn: () => getSubscriptions() }),
      queryClient.ensureQueryData({ queryKey: ['recurring'], queryFn: () => getRecurring() }),
      queryClient.ensureQueryData({ queryKey: ['expenses'], queryFn: () => getExpenses() }),
    ])
  },
  component: SubscriptionsPage,
})

function SubscriptionsPage() {
  const { highlight } = Route.useSearch()
  const { data: config } = useConfig()
  const { data: subscriptions = [] } = useSubscriptions()
  const { data: recurring = [] } = useRecurring()
  const { data: expenses = [] } = useExpenses()
  const [adding, setAdding] = useState(false)
  const [importing, setImporting] = useState(false)
  const [editing, setEditing] = useState<Subscription | null>(null)
  const [deleting, setDeleting] = useState<Subscription | null>(null)
  const [booking, setBooking] = useState<Subscription | null>(null)

  const currency = config?.currency ?? 'USD'
  const profiles = config?.deductionProfiles ?? []
  const rates = useRatesToBase(
    subscriptions.map((s) => s.currency),
    currency
  )

  if (!config) return null
  const summary = summarizeSubscriptions(subscriptions, profiles, (code) => rates.get(code))

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Subscriptions</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setImporting(true)}>
              <Download className="size-4" />
              Import from recurring
            </Button>
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </div>

        <RenewalsDue due={dueRenewals(subscriptions, todayISO())} onBook={setBooking} />
        <SubscriptionSummary currency={currency} summary={summary} />
        {summary.missingRateCount > 0 && (
          <p className="text-muted-foreground text-xs">
            {summary.missingRateCount} subscription{summary.missingRateCount === 1 ? '' : 's'} left out of the totals — exchange rate to{' '}
            {currency} unavailable.
          </p>
        )}

        <Card>
          <CardContent>
            {subscriptions.length === 0 ? (
              <div className="space-y-3 py-8 text-center">
                <p className="text-muted-foreground text-sm">No subscriptions yet.</p>
                <p className="text-muted-foreground text-xs">Add one manually or import your recurring expenses.</p>
              </div>
            ) : (
              <SubscriptionList
                categories={config.categories}
                currency={currency}
                expenses={expenses}
                highlightId={highlight}
                profiles={profiles}
                rates={rates}
                recurring={recurring}
                subscriptions={subscriptions}
                onDelete={setDeleting}
                onEdit={setEditing}
              />
            )}
          </CardContent>
        </Card>
      </div>
      {adding && <SubscriptionFormDialog onClose={() => setAdding(false)} />}
      {editing && <SubscriptionFormDialog subscription={editing} onClose={() => setEditing(null)} />}
      {booking && <BookPaymentDialog categories={config.categories} subscription={booking} onClose={() => setBooking(null)} />}
      {deleting && <DeleteSubscriptionDialog subscription={deleting} onClose={() => setDeleting(null)} />}
      {importing && (
        <ImportRecurringDialog
          profiles={profiles}
          recurring={recurring}
          subscriptions={subscriptions}
          onClose={() => setImporting(false)}
        />
      )}
    </AppLayout>
  )
}
