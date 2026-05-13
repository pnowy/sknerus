import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { TagInput } from '@/components/dashboard/tag-input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useConfig, useCreateRecurring, useUpdateRecurring } from '@/hooks/use-expenses'
import { type RecurringFormInput, recurringFormSchema } from '@/lib/schemas'
import { todayISO } from '@/lib/shared/date-utils'
import type { Category, RecurringExpense } from '@/lib/shared/types/expense'

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NUMS = Array.from({ length: 31 }, (_, i) => i + 1)

type Props = {
  categories: Array<Category>
  currency: string
  allTags: Array<string>
  recurring?: RecurringExpense
  onClose: () => void
}

export function RecurringFormDialog({ categories, currency, allTags, recurring, onClose }: Props) {
  const isEdit = !!recurring
  const create = useCreateRecurring()
  const update = useUpdateRecurring()
  const { data: config } = useConfig()
  const showTags = config?.showTags ?? true
  const showNotes = config?.showNotes ?? true

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RecurringFormInput>({
    // biome-ignore lint/suspicious/noExplicitAny: https://github.com/react-hook-form/resolvers/issues/842
    resolver: zodResolver(recurringFormSchema as any),
    defaultValues: recurring
      ? {
          name: recurring.name,
          amount: Math.abs(recurring.amount),
          isIncome: recurring.amount > 0,
          currency: recurring.currency,
          categoryId: recurring.categoryId,
          tags: recurring.tags,
          notes: recurring.notes ?? '',
          frequency: recurring.frequency,
          dayOfMonth: recurring.dayOfMonth ?? 1,
          dayOfWeek: recurring.dayOfWeek ?? 1,
          month: recurring.month ?? 1,
          startDate: recurring.startDate,
          endDate: recurring.endDate ?? '',
        }
      : {
          name: '',
          amount: 0,
          isIncome: false,
          currency,
          categoryId: categories[0]?.id ?? '',
          tags: [],
          notes: '',
          frequency: 'monthly' as const,
          dayOfMonth: 1,
          dayOfWeek: 1,
          month: 1,
          startDate: todayISO(),
          endDate: '',
        },
  })

  const frequency = useWatch({ control, name: 'frequency' })
  const isPending = create.isPending || update.isPending

  async function onSubmit({ isIncome, amount, endDate, ...rest }: RecurringFormInput) {
    const signedAmount = isIncome ? Math.abs(amount) : -Math.abs(amount)
    const trimmedNotes = rest.notes?.trim()
    const data = {
      ...rest,
      notes: trimmedNotes ? trimmedNotes : undefined,
      amount: signedAmount,
      endDate: endDate || undefined,
      dayOfMonth: rest.frequency === 'weekly' ? undefined : rest.dayOfMonth,
      dayOfWeek: rest.frequency === 'weekly' ? rest.dayOfWeek : undefined,
      month: rest.frequency === 'yearly' ? rest.month : undefined,
    }
    try {
      if (isEdit && recurring) {
        await update.mutateAsync({ ...data, id: recurring.id })
        toast.success('Recurring updated')
      } else {
        await create.mutateAsync(data)
        toast.success('Recurring created')
      }
      onClose()
    } catch {
      toast.error('Failed to save recurring transaction')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Recurring' : 'Add Recurring Transaction'}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" id="recurring-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="rec-name">Name</Label>
              <Input id="rec-name" placeholder="Netflix" {...register('name')} />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="rec-amount">Amount</Label>
              <Input id="rec-amount" min="0.01" step="0.01" type="number" {...register('amount', { valueAsNumber: true })} />
              {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category">
                        {(value: string) => categories.find((c) => c.id === value)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label>Frequency</Label>
              <Controller
                control={control}
                name="frequency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {frequency === 'weekly' && (
              <div className="space-y-1">
                <Label>Day of week</Label>
                <Controller
                  control={control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <Select value={String(field.value ?? 1)} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((d, i) => (
                          <SelectItem key={d} value={String(i)}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
            {(frequency === 'monthly' || frequency === 'yearly') && (
              <div className="space-y-1">
                <Label>Day of month</Label>
                <Controller
                  control={control}
                  name="dayOfMonth"
                  render={({ field }) => (
                    <Select value={String(field.value ?? 1)} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAY_NUMS.map((d) => (
                          <SelectItem key={d} value={String(d)}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
            {frequency === 'yearly' && (
              <div className="space-y-1">
                <Label>Month</Label>
                <Controller
                  control={control}
                  name="month"
                  render={({ field }) => (
                    <Select value={String(field.value ?? 1)} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => (
                          <SelectItem key={m} value={String(i + 1)}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="rec-start">Start date</Label>
              <Input id="rec-start" type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-destructive text-xs">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="rec-end">End date (optional)</Label>
              <Input id="rec-end" type="date" {...register('endDate')} />
            </div>
          </div>
          {showTags && (
            <div className="space-y-1">
              <Label>Tags</Label>
              <Controller
                control={control}
                name="tags"
                render={({ field }) => <TagInput suggestions={allTags} value={field.value} onChange={field.onChange} />}
              />
            </div>
          )}
          {showNotes && (
            <div className="space-y-1">
              <Label htmlFor="rec-notes">Notes</Label>
              <Textarea id="rec-notes" placeholder="Optional notes" rows={3} {...register('notes')} />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="isIncome"
              render={({ field }) => <Switch checked={field.value} id="rec-income" onCheckedChange={field.onChange} />}
            />
            <Label htmlFor="rec-income">Report as income</Label>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isPending} form="recurring-form" type="submit">
            {isPending ? 'Saving...' : isEdit ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
