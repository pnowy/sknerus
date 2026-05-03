import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CURRENCIES } from '@/lib/shared/currencies'

type Props = {
  value: string
  onChange: (currency: string) => void
}

export function CurrencySelector({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger>
        <SelectValue placeholder="Select currency">{(value: string) => CURRENCIES.find((c) => c.code === value)?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map(({ code, label }) => (
          <SelectItem key={code} value={code}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
