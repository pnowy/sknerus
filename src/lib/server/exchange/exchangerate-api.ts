import type { ExchangeRateProvider } from './types'

export class ExchangeRateApiProvider implements ExchangeRateProvider {
  constructor(private readonly apiKey: string) {}

  async fetchRate(_date: string, from: string, to: string): Promise<number> {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${this.apiKey}/pair/${from}/${to}`)
    if (!res.ok) throw new Error(`ExchangeRate-API fetch failed: ${res.status}`)
    const json = (await res.json()) as { result: string; conversion_rate?: number }
    if (json.result !== 'success' || json.conversion_rate === undefined) {
      throw new Error(`ExchangeRate-API: no rate for ${from}→${to}`)
    }
    return json.conversion_rate
  }
}
