import { zodResolver } from '@hookform/resolvers/zod'
import { Link2, X } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { LinkPaymentsDialog } from '@/components/subscriptions/link-payments-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useConfig, useExpenses, useRecurring } from '@/hooks/use-expenses'
import { useCreateSubscription, useRatesToBase, useSubscriptions, useUpdateSubscription } from '@/hooks/use-subscriptions'
import { type SubscriptionFormInput, type SubscriptionPayload, subscriptionFormSchema } from '@/lib/schemas'
import { todayISO } from '@/lib/shared/date-utils'
import { getEnteredAmount, getEnteredCurrency } from '@/lib/shared/expense-utils'
import { formatCurrency, formatDate } from '@/lib/shared/format'
import {
  calcMonthlyCost,
  formatBillingPeriod,
  isConvertibleRecurring,
  recurringPeriodMonths,
  renewalAfterPayments,
} from '@/lib/shared/subscription-utils'
import type { RecurringExpense } from '@/lib/shared/types/expense'
import { RecurringLinkMode, type Subscription } from '@/lib/shared/types/subscription'

const PERIOD_PRESETS = [1, 3, 6, 12, 24]
const LINK_MODE_LABELS: Record<RecurringLinkMode, string> = {
  [RecurringLinkMode.Manual]: 'Manual payments',
  [RecurringLinkMode.Create]: 'Create recurring transaction',
  [RecurringLinkMode.Existing]: 'Link existing recurring',
}

type Props = {
  subscription?: Subscription
  /** Pre-links a new subscription to this recurring transaction ("Track as subscription") */
  fromRecurring?: RecurringExpense
  onClose: () => void
}

function defaultsFor(subscription: Subscription | undefined, fromRecurring: RecurringExpense | undefined, baseCurrency: string) {
  if (subscription) {
    return {
      name: subscription.name,
      amount: subscription.amount,
      currency: subscription.currency,
      billingPeriodMonths: subscription.billingPeriodMonths,
      isBusiness: !!subscription.deductionProfileId,
      deductionProfileId: subscription.deductionProfileId ?? '',
      priceIncludesVat: subscription.priceIncludesVat,
      active: subscription.active,
      categoryId: subscription.categoryId ?? '',
      nextRenewal: subscription.nextRenewal ?? '',
      url: subscription.url ?? '',
      notes: subscription.notes ?? '',
      linkMode: subscription.recurringId ? RecurringLinkMode.Existing : RecurringLinkMode.Manual,
      scheduleStartDate: todayISO(),
      existingRecurringId: subscription.recurringId ?? '',
      paymentIds: subscription.paymentIds ?? [],
    }
  }
  return {
    name: fromRecurring?.name ?? '',
    amount: fromRecurring ? Math.abs(fromRecurring.amount) : 0,
    currency: fromRecurring?.currency ?? baseCurrency,
    billingPeriodMonths: (fromRecurring && recurringPeriodMonths(fromRecurring)) ?? 1,
    isBusiness: false,
    deductionProfileId: '',
    priceIncludesVat: true,
    active: true,
    categoryId: fromRecurring?.categoryId ?? '',
    nextRenewal: '',
    url: '',
    notes: fromRecurring?.notes ?? '',
    linkMode: fromRecurring ? RecurringLinkMode.Existing : RecurringLinkMode.Manual,
    scheduleStartDate: todayISO(),
    existingRecurringId: fromRecurring?.id ?? '',
    paymentIds: [],
  }
}

export function SubscriptionFormDialog({ subscription, fromRecurring, onClose }: Props) {
  const isEdit = !!subscription
  const { data: config } = useConfig()
  const { data: recurring = [] } = useRecurring()
  const { data: subscriptions = [] } = useSubscriptions()
  const { data: expenses = [] } = useExpenses()
  const [linkingPayments, setLinkingPayments] = useState(false)
  const create = useCreateSubscription()
  const update = useUpdateSubscription()

  const baseCurrency = config?.currency ?? 'USD'
  const categories = config?.categories ?? []
  const profiles = config?.deductionProfiles ?? []

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SubscriptionFormInput>({
    // biome-ignore lint/suspicious/noExplicitAny: https://github.com/react-hook-form/resolvers/issues/842
    resolver: zodResolver(subscriptionFormSchema as any),
    defaultValues: defaultsFor(subscription, fromRecurring, baseCurrency),
  })

  const watched = useWatch({ control })
  const linkMode = watched.linkMode ?? RecurringLinkMode.Manual
  const currency = watched.currency ?? baseCurrency
  const rates = useRatesToBase([currency], baseCurrency)

  const currencies = [...new Set([baseCurrency, ...(config?.supportedCurrencies ?? []), currency])]
  const takenRecurringIds = new Set(subscriptions.filter((s) => s.id !== subscription?.id).map((s) => s.recurringId))
  const linkableRecurring = recurring.filter((r) => isConvertibleRecurring(r) && !takenRecurringIds.has(r.id))
  const period = watched.billingPeriodMonths ?? 1
  // Explicit flag so typing e.g. "18" doesn't snap to the "Monthly" preset after the first keystroke
  const [customPeriodChosen, setCustomPeriodChosen] = useState(false)
  const isCustomPeriod = customPeriodChosen || !PERIOD_PRESETS.includes(period)

  const rate = rates.get(currency)
  const profile = watched.isBusiness ? profiles.find((p) => p.id === watched.deductionProfileId) : undefined
  const preview =
    rate !== undefined && (watched.amount ?? 0) > 0
      ? calcMonthlyCost(
          {
            id: 'preview',
            name: '',
            amount: watched.amount ?? 0,
            currency,
            billingPeriodMonths: period,
            priceIncludesVat: watched.priceIncludesVat ?? true,
            active: true,
          },
          profile,
          rate
        )
      : undefined

  function applyRecurring(id: string) {
    const r = recurring.find((item) => item.id === id)
    if (!r) return
    setValue('name', r.name)
    setValue('amount', Math.abs(r.amount))
    setValue('currency', r.currency)
    setValue('billingPeriodMonths', recurringPeriodMonths(r) ?? 1)
    setValue('categoryId', r.categoryId)
  }

  const paymentIds = watched.paymentIds ?? []
  const expenseById = new Map(expenses.map((expense) => [expense.id, expense]))
  const linkedPayments = paymentIds.flatMap((id) => expenseById.get(id) ?? []).sort((a, b) => b.date.localeCompare(a.date))
  const takenPaymentIds = new Set(subscriptions.filter((s) => s.id !== subscription?.id).flatMap((s) => s.paymentIds ?? []))

  function linkPayments(ids: Array<string>) {
    setValue('paymentIds', ids)
    // the latest payment tells when the next one is due; only move the date forward, never back
    const suggested = renewalAfterPayments(
      ids.flatMap((id) => expenseById.get(id) ?? []),
      period
    )
    const current = watched.nextRenewal ?? ''
    if (suggested && suggested > current) setValue('nextRenewal', suggested)
  }

  const isPending = create.isPending || update.isPending

  async function onSubmit(data: SubscriptionFormInput) {
    const trimmedNotes = data.notes?.trim()
    const payload: SubscriptionPayload = {
      name: data.name,
      amount: data.amount,
      currency: data.currency,
      billingPeriodMonths: data.billingPeriodMonths,
      deductionProfileId: data.isBusiness ? data.deductionProfileId : undefined,
      priceIncludesVat: data.priceIncludesVat,
      active: data.active,
      categoryId: data.categoryId || undefined,
      nextRenewal: data.linkMode === RecurringLinkMode.Manual && data.nextRenewal ? data.nextRenewal : undefined,
      url: data.url || undefined,
      notes: trimmedNotes ? trimmedNotes : undefined,
      recurringId: data.linkMode === RecurringLinkMode.Existing ? data.existingRecurringId : undefined,
      paymentIds: data.paymentIds.length > 0 ? data.paymentIds : undefined,
      schedule: data.linkMode === RecurringLinkMode.Create ? { startDate: data.scheduleStartDate } : undefined,
    }
    try {
      if (isEdit && subscription) {
        await update.mutateAsync({ ...payload, id: subscription.id })
        toast.success('Subscription updated')
      } else {
        await create.mutateAsync(payload)
        toast.success('Subscription added')
      }
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save subscription')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" id="subscription-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="sub-name">Name</Label>
              <Input id="sub-name" placeholder="YouTube Premium" {...register('name')} />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="sub-amount">Price per period</Label>
              <div className="flex gap-2">
                <Input
                  className="min-w-0 flex-1"
                  id="sub-amount"
                  min="0.01"
                  step="0.01"
                  type="number"
                  {...register('amount', { valueAsNumber: true })}
                />
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                      <SelectTrigger className="w-24">
                        <SelectValue>{(value: string) => value}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Billing period</Label>
              <Controller
                control={control}
                name="billingPeriodMonths"
                render={({ field }) => (
                  <Select
                    value={isCustomPeriod ? 'custom' : String(field.value)}
                    onValueChange={(v) => {
                      if (!v) return
                      setCustomPeriodChosen(v === 'custom')
                      if (v !== 'custom') field.onChange(Number(v))
                      else if (PERIOD_PRESETS.includes(field.value)) field.onChange(2)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{(value: string) => (value === 'custom' ? 'Custom' : formatBillingPeriod(Number(value)))}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PERIOD_PRESETS.map((months) => (
                        <SelectItem key={months} value={String(months)}>
                          {formatBillingPeriod(months)}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.billingPeriodMonths && <p className="text-destructive text-xs">{errors.billingPeriodMonths.message}</p>}
            </div>
            {isCustomPeriod && (
              <div className="flex items-center gap-2 text-sm sm:col-span-2">
                <Label htmlFor="sub-period-months">Billed every</Label>
                <Input
                  className="w-20"
                  id="sub-period-months"
                  max="120"
                  min="1"
                  type="number"
                  {...register('billingPeriodMonths', { valueAsNumber: true })}
                />
                <span className="text-muted-foreground">months</span>
              </div>
            )}
            <div className="space-y-1">
              <Label>Category</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v ?? '')}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No category">
                        {(value: string) => categories.find((c) => c.id === value)?.name ?? 'No category'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No category</SelectItem>
                      {categories
                        .filter((c) => !c.isIncome)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && <p className="text-destructive text-xs">{errors.categoryId.message}</p>}
            </div>
            <div className="flex items-end gap-2 pb-2">
              <Controller
                control={control}
                name="active"
                render={({ field }) => <Switch checked={field.value} id="sub-active" onCheckedChange={field.onChange} />}
              />
              <Label htmlFor="sub-active">Active</Label>
            </div>
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="isBusiness"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    id="sub-business"
                    onCheckedChange={(checked) => {
                      field.onChange(checked)
                      // With a single profile there's nothing to choose, so preselect it
                      if (checked && profiles.length === 1 && !watched.deductionProfileId) setValue('deductionProfileId', profiles[0].id)
                    }}
                  />
                )}
              />
              <Label htmlFor="sub-business">Business cost</Label>
            </div>
            {watched.isBusiness &&
              (profiles.length === 0 ? (
                <p className="text-destructive text-xs">Add a deduction profile in Settings → Subscriptions first.</p>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Deduction profile</Label>
                    <Controller
                      control={control}
                      name="deductionProfileId"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={(v) => field.onChange(v ?? '')}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select profile">
                              {(value: string) => profiles.find((p) => p.id === value)?.name}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {profiles.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.deductionProfileId && <p className="text-destructive text-xs">{errors.deductionProfileId.message}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Controller
                      control={control}
                      name="priceIncludesVat"
                      render={({ field }) => <Switch checked={field.value} id="sub-vat" onCheckedChange={field.onChange} />}
                    />
                    <Label htmlFor="sub-vat">Price includes VAT</Label>
                  </div>
                </div>
              ))}
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <Label>Transactions</Label>
            <Controller
              control={control}
              name="linkMode"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(value: RecurringLinkMode) => LINK_MODE_LABELS[value]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(RecurringLinkMode).map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {LINK_MODE_LABELS[mode]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {linkMode === RecurringLinkMode.Manual && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="sub-renewal">Next renewal (optional)</Label>
                  <Input id="sub-renewal" type="date" {...register('nextRenewal')} />
                  <p className="text-muted-foreground text-xs">
                    A week before this date the subscription asks whether to book the payment, skip it or end the subscription.
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Payments</Label>
                    <Button size="sm" type="button" variant="outline" onClick={() => setLinkingPayments(true)}>
                      <Link2 className="size-4" />
                      Link payments
                    </Button>
                  </div>
                  {linkedPayments.length === 0 ? (
                    <p className="text-muted-foreground text-xs">No transactions linked yet.</p>
                  ) : (
                    <ul className="divide-y rounded-md border text-sm">
                      {linkedPayments.map((expense) => (
                        <li key={expense.id} className="flex items-center gap-3 px-2 py-1">
                          <span className="text-muted-foreground w-24 shrink-0 tabular-nums">{formatDate(expense.date)}</span>
                          <span className="min-w-0 flex-1 truncate">{expense.name}</span>
                          <span className="shrink-0 tabular-nums">
                            {formatCurrency(Math.abs(getEnteredAmount(expense)), getEnteredCurrency(expense))}
                          </span>
                          <Button
                            aria-label={`Unlink ${expense.name}`}
                            size="icon-sm"
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              setValue(
                                'paymentIds',
                                paymentIds.filter((id) => id !== expense.id)
                              )
                            }
                          >
                            <X className="size-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
            {linkMode === RecurringLinkMode.Create && (
              <div className="space-y-1">
                <Label htmlFor="sub-start">First payment</Label>
                <Input id="sub-start" type="date" {...register('scheduleStartDate')} />
                {errors.scheduleStartDate && <p className="text-destructive text-xs">{errors.scheduleStartDate.message}</p>}
                <p className="text-muted-foreground text-xs">
                  Booked as a recurring expense {formatBillingPeriod(period).toLowerCase()}, starting on this day.
                </p>
              </div>
            )}
            {linkMode === RecurringLinkMode.Existing && (
              <div className="space-y-1">
                <Controller
                  control={control}
                  name="existingRecurringId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        if (!v) return
                        field.onChange(v)
                        applyRecurring(v)
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select recurring">
                          {(value: string) => recurring.find((r) => r.id === value)?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {linkableRecurring.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name} · {formatCurrency(Math.abs(r.amount), r.currency)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.existingRecurringId && <p className="text-destructive text-xs">{errors.existingRecurringId.message}</p>}
                <p className="text-muted-foreground text-xs">
                  Name, price, period and category stay in sync with the recurring transaction.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="sub-url">Website (optional)</Label>
              <Input id="sub-url" placeholder="https://" type="url" {...register('url')} />
              {errors.url && <p className="text-destructive text-xs">{errors.url.message}</p>}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="sub-notes">Notes</Label>
              <Textarea id="sub-notes" placeholder="Optional notes" rows={2} {...register('notes')} />
            </div>
          </div>

          {preview && (
            <div className="bg-muted space-y-1 rounded-md px-3 py-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Monthly cost</span>
                <span className="font-medium tabular-nums">≈ {formatCurrency(preview.gross, baseCurrency)}</span>
              </div>
              {profile && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">After deductions</span>
                  <span className="font-medium tabular-nums">≈ {formatCurrency(preview.effective, baseCurrency)}</span>
                </div>
              )}
            </div>
          )}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isPending} form="subscription-form" type="submit">
            {isPending ? 'Saving...' : isEdit ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
      {linkingPayments && (
        <LinkPaymentsDialog
          expenses={expenses}
          initialQuery={watched.name ?? ''}
          selectedIds={paymentIds}
          takenIds={takenPaymentIds}
          onClose={() => setLinkingPayments(false)}
          onConfirm={linkPayments}
        />
      )}
    </Dialog>
  )
}
