import { ReceiptText } from 'lucide-react'

type Props = {
  message: string
}

export function EmptyState({ message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <ReceiptText className="size-10 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
