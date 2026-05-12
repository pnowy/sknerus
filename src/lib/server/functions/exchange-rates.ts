import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { logger } from '@/lib/logging'
import { createExchangeProvider } from '@/lib/server/exchange'
import { storage } from '@/lib/server/storage'

const log = logger.named('exchange')

export const resolveExchangeRate = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      from: z.string().min(1),
      to: z.string().min(1),
    })
  )
  .handler(async ({ data: { date, from, to } }) => {
    if (from === to) return 1

    const cached = await storage.getExchangeRates()
    const entry = cached.find((r) => r.date === date)
    if (entry?.rates[from]?.[to] !== undefined) return entry.rates[from][to]

    const config = await storage.getConfig()
    const provider = createExchangeProvider(config)
    let rate: number
    try {
      rate = await provider.fetchRate(date, from, to)
    } catch (err) {
      log.error(`Failed to fetch rate ${from}→${to} on ${date}`, {
        provider: config.exchangeProvider,
        error: err instanceof Error ? err.message : String(err),
      })
      throw err
    }

    const existing = cached.find((r) => r.date === date)
    if (existing) {
      existing.rates[from] = { ...existing.rates[from], [to]: rate }
    } else {
      cached.push({ date, rates: { [from]: { [to]: rate } } })
    }
    await storage.saveExchangeRates(cached)

    return rate
  })
