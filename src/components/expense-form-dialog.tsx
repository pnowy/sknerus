import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { TagInput } from '@/components/dashboard/tag-input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useCreateExpense, useUpdateExpense } from '@/hooks/use-expenses'
import { type ExpenseFormInput, expenseFormSchema } from '@/lib/schemas'
import { todayISO } from '@/lib/shared/date-utils'
import type { Category, Expense } from '@/lib/shared/types/expense'

function cloneDateFrom(templateDate: string): string {
  const now = new Date()
  const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const isRecent = templateDate.slice(0, 7) === ym(now) || templateDate.slice(0, 7) === ym(prevMonth)
  return isRecent ? todayISO() : templateDate
}

type Props = {
  open: boolean
  onClose: () => void
  categories: Array<Category>
  currency: string
  allTags: Array<string>
  expense?: Expense
  template?: Expense
}

export function ExpenseFormDialog({ open, onClose, categories, currency, allTags, expense, template }: Props) {
  const isEdit = !!expense
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const isPending = createExpense.isPending || updateExpense.isPending

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormInput>({
    // biome-ignore lint/suspicious/noExplicitAny: https://github.com/react-hook-form/resolvers/issues/842
    resolver: zodResolver(expenseFormSchema as any),
    defaultValues: expense
      ? {
          name: expense.name,
          amount: Math.abs(expense.amount),
          currency: expense.currency,
          categoryId: expense.categoryId,
          date: expense.date,
          tags: expense.tags,
          isIncome: expense.amount > 0,
        }
      : template
        ? {
            name: template.name,
            amount: Math.abs(template.amount),
            currency: template.currency,
            categoryId: template.categoryId,
            date: cloneDateFrom(template.date),
            tags: template.tags,
            isIncome: template.amount > 0,
          }
        : {
            name: '',
            amount: 0,
            currency,
            categoryId: categories[0]?.id ?? '',
            date: todayISO(),
            tags: [],
            isIncome: false,
          },
  })

  function handleClose() {
    reset()
    onClose()
  }

  async function onSubmit({ isIncome, amount, ...rest }: ExpenseFormInput) {
    try {
      const signedAmount = isIncome ? Math.abs(amount) : -Math.abs(amount)
      if (isEdit && expense) {
        await updateExpense.mutateAsync({ ...rest, amount: signedAmount, id: expense.id })
        toast.success('Expense updated')
      } else {
        await createExpense.mutateAsync({ ...rest, amount: signedAmount })
        toast.success('Expense added')
      }
      handleClose()
    } catch {
      toast.error(isEdit ? 'Failed to update expense' : 'Failed to add expense')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" id="expense-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="exp-name">Name</Label>
              <Input id="exp-name" placeholder="Coffee" {...register('name')} />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="exp-amount">Amount</Label>
              <Input id="exp-amount" min="0.01" step="0.01" type="number" {...register('amount', { valueAsNumber: true })} />
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
              <Label htmlFor="exp-date">Date</Label>
              <Input id="exp-date" type="date" {...register('date')} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Tags</Label>
            <Controller
              control={control}
              name="tags"
              render={({ field }) => <TagInput suggestions={allTags} value={field.value} onChange={field.onChange} />}
            />
          </div>
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="isIncome"
              render={({ field }) => <Switch checked={field.value} id="exp-income" onCheckedChange={field.onChange} />}
            />
            <Label htmlFor="exp-income">Report as income</Label>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button disabled={isPending} form="expense-form" type="submit">
            {isPending ? 'Saving...' : isEdit ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
