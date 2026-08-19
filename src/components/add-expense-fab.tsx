import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FabPosition } from '@/lib/shared/types/fab-position'
import { cn } from '@/lib/utils'

type Props = {
  position: FabPosition
  onClick: () => void
}

/** Thumb-reachable add-expense button, mobile only — the toolbar button takes over from `sm` up. */
export function AddExpenseFab({ position, onClick }: Props) {
  if (position === FabPosition.Off) return null

  return (
    <Button
      aria-label="Add expense"
      className={cn(
        'fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-20 size-14 rounded-full shadow-lg sm:hidden',
        position === FabPosition.Left ? 'left-6' : 'right-6'
      )}
      onClick={onClick}
    >
      <Plus className="size-6" />
    </Button>
  )
}
