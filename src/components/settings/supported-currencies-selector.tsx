import type { CURRENCIES } from '@/lib/shared/currencies'

type Currency = (typeof CURRENCIES)[number]

type Props = {
  allCurrencies: ReadonlyArray<Currency>
  defaultCurrency: string
  value: Array<string>
  onChange: (codes: Array<string>) => void
}

export function SupportedCurrenciesSelector({ allCurrencies, defaultCurrency, value, onChange }: Props) {
  const available = allCurrencies.filter((c) => c.code !== defaultCurrency)

  function toggle(code: string) {
    onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {available.map((c) => {
        const isActive = value.includes(c.code)
        return (
          <button
            key={c.code}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
              isActive ? 'border-foreground/30 bg-foreground/10 font-medium' : 'border-border opacity-50 hover:opacity-75'
            }`}
            type="button"
            onClick={() => toggle(c.code)}
          >
            {c.code}
          </button>
        )
      })}
    </div>
  )
}
