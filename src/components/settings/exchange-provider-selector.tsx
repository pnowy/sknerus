import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExchangeProvider } from '@/lib/shared/types/exchange-provider'

const PROVIDER_OPTIONS = [
  { value: ExchangeProvider.Frankfurter, label: 'Frankfurter (31 currencies, no key needed)' },
  { value: ExchangeProvider.ExchangeRateApi, label: 'ExchangeRate-API (165 currencies, key required)' },
] as const

type Props = {
  provider: string
  apiKey?: string
  onChange: (provider: string, apiKey?: string) => void
}

export function ExchangeProviderSelector({ provider, apiKey, onChange }: Props) {
  const [localKey, setLocalKey] = useState(apiKey ?? '')

  function handleProviderChange(value: string) {
    onChange(value, value === ExchangeProvider.ExchangeRateApi ? localKey || undefined : undefined)
  }

  function handleKeyBlur() {
    if (provider === ExchangeProvider.ExchangeRateApi) {
      onChange(provider, localKey || undefined)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Provider</Label>
        <Select value={provider} onValueChange={(v) => v && handleProviderChange(v)}>
          <SelectTrigger className="w-full min-w-80">
            <SelectValue>{(value: string) => PROVIDER_OPTIONS.find((o) => o.value === value)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PROVIDER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {provider === ExchangeProvider.ExchangeRateApi && (
        <div className="space-y-1">
          <Label htmlFor="exchange-api-key">API Key</Label>
          <Input
            id="exchange-api-key"
            placeholder="Your ExchangeRate-API key"
            type="password"
            value={localKey}
            onBlur={handleKeyBlur}
            onChange={(e) => setLocalKey(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            Free tier: 1,500 requests/month.{' '}
            <a className="underline" href="https://www.exchangerate-api.com" rel="noopener noreferrer" target="_blank">
              Get a key
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
