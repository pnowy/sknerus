import { logger } from '@/lib/logging'
import { createExchangeProvider } from '@/lib/server/exchange'
import { storage } from '@/lib/server/storage'

const log = logger.named('exchange')

export async function resolveExchangeRate(date: string, from: string, to: string): Promise<number> {
  if (from === to) return 1

  const cached = await storage.getExchangeRates()
  const entry = cached.find((rate) => rate.date === date)
  if (entry?.rates[from]?.[to] !== undefined) return entry.rates[from][to]

  const config = await storage.getConfig()
  const provider = createExchangeProvider(config)
  let rate: number
  try {
    rate = await provider.fetchRate(date, from, to)
  } catch (error) {
    log.error(`Failed to fetch rate ${from}→${to} on ${date}`, {
      provider: config.exchangeProvider,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }

  const existing = cached.find((item) => item.date === date)
  if (existing) {
    existing.rates[from] = { ...existing.rates[from], [to]: rate }
  } else {
    cached.push({ date, rates: { [from]: { [to]: rate } } })
  }
  await storage.saveExchangeRates(cached)

  return rate
}
