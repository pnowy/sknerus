import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { TagInput } from '@/components/dashboard/tag-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useCreateExpense } from '@/hooks/use-expenses'
import { type ExpenseFormInput, expenseFormSchema } from '@/lib/schemas'
import { todayISO } from '@/lib/shared/date-utils.ts'
import type { Category } from '@/lib/shared/types/expense.ts'

type Props = {
  categories: Array<Category>
  currency: string
  allTags: Array<string>
}

const defaultValues: ExpenseFormInput = {
  name: '',
  amount: 0,
  currency: 'USD',
  category: '',
  date: todayISO(),
  tags: [],
  isIncome: false,
}

export function AddExpenseForm({ categories, currency, allTags }: Props) {
  const [open, setOpen] = useState(false)
  const createExpense = useCreateExpense()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormInput>({
    // biome-ignore lint/suspicious/noExplicitAny: https://github.com/react-hook-form/resolvers/issues/842
    resolver: zodResolver(expenseFormSchema as any),
    defaultValues: { ...defaultValues, currency, category: categories[0]?.name ?? '' },
  })

  async function onSubmit({ isIncome, amount, ...rest }: ExpenseFormInput) {
    try {
      const signedAmount = isIncome ? Math.abs(amount) : -Math.abs(amount)
      await createExpense.mutateAsync({ ...rest, amount: signedAmount })
      toast.success('Expense added')
      reset({ ...defaultValues, currency, category: categories[0]?.name ?? '' })
      setOpen(false)
    } catch {
      toast.error('Failed to add expense')
    }
  }

  return (
    <div className="rounded-lg border border-border">
      <button
        className="flex w-full items-center justify-between px-4 py-3 font-medium text-sm"
        type="button"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2">
          <Plus className="size-4" />
          Add Expense
        </span>
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>
      {open && (
        <form className="space-y-4 border-border border-t px-4 pt-3 pb-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Coffee" {...register('name')} />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" min="0.01" step="0.01" type="number" {...register('amount', { valueAsNumber: true })} />
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
                      <SelectValue placeholder="Select category" />
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
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register('date')} />
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="isIncome"
                render={({ field }) => <Switch checked={field.value} id="isIncome" onCheckedChange={field.onChange} />}
              />
              <Label htmlFor="isIncome">Report as income</Label>
            </div>
            <Button disabled={createExpense.isPending} type="submit">
              {createExpense.isPending ? 'Saving...' : 'Add'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
