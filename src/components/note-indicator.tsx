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
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring -m-1 inline-flex shrink-0 cursor-pointer items-center rounded p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <MessageSquareText className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="text-xs break-words whitespace-pre-wrap">{notes}</PopoverContent>
    </Popover>
  )
}
