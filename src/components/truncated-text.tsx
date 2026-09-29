import { useRef, useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type Props = {
  text: string
  className?: string
}

// Text clamped to two lines with an ellipsis; the full text is shown in a tooltip only when it is actually cut off
export function TruncatedText({ text, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)

  const isTruncated = () => !!ref.current && ref.current.scrollHeight > ref.current.clientHeight

  return (
    <Tooltip open={open} onOpenChange={(next) => setOpen(next && isTruncated())}>
      <TooltipTrigger delay={300} render={<span ref={ref} />} className={cn('line-clamp-2 min-w-0 whitespace-normal', className)}>
        {text}
      </TooltipTrigger>
      <TooltipContent className="wrap-break-word whitespace-normal">{text}</TooltipContent>
    </Tooltip>
  )
}
