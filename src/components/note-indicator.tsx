import { MessageSquareText } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type Props = {
  notes: string
}

export function NoteIndicator({ notes }: Props) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Show notes"
        className="-m-1 inline-flex shrink-0 cursor-pointer items-center rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={(e) => e.stopPropagation()}
      >
        <MessageSquareText className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="whitespace-pre-wrap break-words text-xs">{notes}</PopoverContent>
    </Popover>
  )
}
