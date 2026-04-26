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
import { useUpdateExpense } from '@/hooks/use-expenses'
import { type ExpenseFormInput, expenseFormSchema } from '@/lib/schemas'
import type { Category, Expense } from '@/lib/shared/types/expense.ts'

type Props = {
  expense: Expense
  categories: Array<Category>
  allTags: Array<string>
  onClose: () => void
}

export function EditExpenseDialog({ expense, categories, allTags, onClose }: Props) {
  const updateExpense = useUpdateExpense()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormInput>({
    // biome-ignore lint/suspicious/noExplicitAny: https://github.com/react-hook-form/resolvers/issues/842
    resolver: zodResolver(expenseFormSchema as any),
    defaultValues: {
      name: expense.name,
      amount: Math.abs(expense.amount),
      currency: expense.currency,
      category: expense.category,
      date: expense.date,
      tags: expense.tags,
      isIncome: expense.amount > 0,
    },
  })

  async function onSubmit({ isIncome, amount, ...rest }: ExpenseFormInput) {
    try {
      const signedAmount = isIncome ? Math.abs(amount) : -Math.abs(amount)
      await updateExpense.mutateAsync({ ...rest, amount: signedAmount, id: expense.id })
      toast.success('Expense updated')
      onClose()
    } catch {
      toast.error('Failed to update expense')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" id="edit-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" {...register('name')} />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-amount">Amount</Label>
              <Input id="edit-amount" min="0.01" step="0.01" type="number" {...register('amount', { valueAsNumber: true })} />
              {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.name} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-date">Date</Label>
              <Input id="edit-date" type="date" {...register('date')} />
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
              render={({ field }) => <Switch checked={field.value} id="edit-income" onCheckedChange={field.onChange} />}
            />
            <Label htmlFor="edit-income">Report as income</Label>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={updateExpense.isPending} form="edit-form" type="submit">
            {updateExpense.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
