import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBookSubscriptionPayment } from '@/hooks/use-subscriptions'
import { type BookPaymentInput, bookPaymentSchema } from '@/lib/schemas'
import { todayISO } from '@/lib/shared/date-utils'
import { formatDate } from '@/lib/shared/format'
import { advanceRenewal } from '@/lib/shared/subscription-utils'
import type { Category } from '@/lib/shared/types/expense'
import type { Subscription } from '@/lib/shared/types/subscription'

type Props = {
  subscription: Subscription
  categories: Array<Category>
  onClose: () => void
}

export function BookPaymentDialog({ subscription, categories, onClose }: Props) {
  const book = useBookSubscriptionPayment()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BookPaymentInput>({
    // biome-ignore lint/suspicious/noExplicitAny: https://github.com/react-hook-form/resolvers/issues/842
    resolver: zodResolver(bookPaymentSchema as any),
    defaultValues: {
      date: subscription.nextRenewal ?? todayISO(),
      amount: subscription.amount,
      categoryId: subscription.categoryId ?? '',
      updatePrice: true,
    },
  })
  const amount = useWatch({ control, name: 'amount' })
  const date = useWatch({ control, name: 'date' })
  const priceChanged = Number.isFinite(amount) && amount > 0 && amount !== subscription.amount
  const nextRenewal = advanceRenewal(subscription.nextRenewal ?? date ?? todayISO(), subscription.billingPeriodMonths)

  async function onSubmit(data: BookPaymentInput) {
    try {
      await book.mutateAsync({ ...data, updatePrice: priceChanged && data.updatePrice, id: subscription.id })
      toast.success(`${subscription.name} payment booked`)
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to book payment')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book {subscription.name} payment</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" id="book-payment-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="book-date">Date</Label>
              <Input id="book-date" type="date" {...register('date')} />
              {errors.date && <p className="text-destructive text-xs">{errors.date.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="book-amount">Amount ({subscription.currency})</Label>
              <Input id="book-amount" min="0.01" step="0.01" type="number" {...register('amount', { valueAsNumber: true })} />
              {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category">
                      {(value: string) => categories.find((c) => c.id === value)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
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
          {priceChanged && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input className="accent-primary size-4" type="checkbox" {...register('updatePrice')} />
              Update the subscription price to this amount
            </label>
          )}
          <p className="text-muted-foreground text-xs">Next renewal moves to {formatDate(nextRenewal)}.</p>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={book.isPending} form="book-payment-form" type="submit">
            {book.isPending ? 'Booking…' : 'Book payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
