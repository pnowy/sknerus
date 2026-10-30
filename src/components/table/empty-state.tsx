import { ReceiptText } from 'lucide-react'

type Props = {
  message: string
}

export function EmptyState({ message }: Props) {
  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-16">
      <ReceiptText className="size-10 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
