import { zodResolver } from '@hookform/resolvers/zod'
import { addDays, format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type CustomDateRange, customDateRangeSchema } from '@/lib/shared/search-params'

type Props = {
  from: Date
  to: Date
  onApply: (range: CustomDateRange) => void
  onClose: () => void
}

export function CustomDateRangeDialog({ from, to, onApply, onClose }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomDateRange>({
    resolver: zodResolver(customDateRangeSchema),
    defaultValues: { from: format(from, 'yyyy-MM-dd'), to: format(addDays(to, -1), 'yyyy-MM-dd') },
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Custom date range</DialogTitle>
          <DialogDescription>Show transactions between these dates, including both days.</DialogDescription>
        </DialogHeader>
        <form
          id="custom-date-range"
          className="space-y-4"
          noValidate
          onSubmit={handleSubmit((range) => {
            onApply(range)
            onClose()
          })}
        >
          <div className="space-y-1">
            <Label htmlFor="range-from">Start date</Label>
            <Input
              id="range-from"
              type="date"
              required
              aria-invalid={!!errors.from}
              aria-describedby={errors.from ? 'range-from-error' : undefined}
              {...register('from')}
            />
            {errors.from && (
              <p id="range-from-error" className="text-destructive text-xs">
                {errors.from.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="range-to">End date</Label>
            <Input
              id="range-to"
              type="date"
              required
              aria-invalid={!!errors.to}
              aria-describedby={errors.to ? 'range-to-error' : undefined}
              {...register('to')}
            />
            {errors.to && (
              <p id="range-to-error" className="text-destructive text-xs">
                {errors.to.message}
              </p>
            )}
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="custom-date-range">
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
