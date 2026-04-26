import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  label: string
  onPrev: () => void
  onNext: () => void
  onReset: () => void
  canGoNext: boolean
  isCurrentMonth: boolean
}

export function MonthNav({ label, onPrev, onNext, onReset, canGoNext, isCurrentMonth }: Props) {
  return (
    <div className="flex items-center gap-1">
      <Button size="icon" variant="ghost" onClick={onPrev}>
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-36 text-center font-medium text-sm">{label}</span>
      <Button disabled={!canGoNext} size="icon" variant="ghost" onClick={onNext}>
        <ChevronRight className="size-4" />
      </Button>
      {!isCurrentMonth && (
        <Button size="icon" variant="ghost" title="Back to current month" onClick={onReset}>
          <RotateCcw className="size-3.5" />
        </Button>
      )}
    </div>
  )
}
