import type { ExchangeRateProvider } from './types'

const SUPPORTED = new Set([
  'AUD',
  'BRL',
  'CAD',
  'CHF',
  'CNY',
  'CZK',
  'DKK',
  'EUR',
  'GBP',
  'HKD',
  'HUF',
  'IDR',
  'ILS',
  'INR',
  'ISK',
  'JPY',
  'KRW',
  'MXN',
  'MYR',
  'NOK',
  'NZD',
  'PHP',
  'PLN',
  'RON',
  'SEK',
  'SGD',
  'THB',
  'TRY',
  'USD',
  'ZAR',
])

export class FrankfurterProvider implements ExchangeRateProvider {
  async fetchRate(date: string, from: string, to: string): Promise<number> {
    const unsupported = [from, to].filter((c) => !SUPPORTED.has(c))
    if (unsupported.length > 0) {
      throw new Error(
        `Frankfurter does not support ${unsupported.join(', ')}. Switch to ExchangeRate-API provider in Settings for wider currency coverage.`
      )
    }
    const res = await fetch(`https://api.frankfurter.dev/v1/${date}?base=${from}&symbols=${to}`)
    if (!res.ok) throw new Error(`Frankfurter fetch failed: ${res.status}`)
    const json = (await res.json()) as { rates: Record<string, number> }
    const rate = json.rates[to]
    if (rate === undefined) throw new Error(`No rate for ${from}→${to} on ${date}`)
    return rate
  }
}
