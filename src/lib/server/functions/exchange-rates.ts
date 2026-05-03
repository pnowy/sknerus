import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { storage } from '@/lib/server/storage'

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

    const res = await fetch(`https://api.frankfurter.app/${date}?base=${from}&symbols=${to}`)
    if (!res.ok) throw new Error(`Exchange rate fetch failed: ${res.status}`)
    const json = (await res.json()) as { base: string; date: string; rates: Record<string, number> }

    const rate = json.rates[to]
    if (rate === undefined) throw new Error(`No rate for ${from}→${to} on ${date}`)

    // Upsert into single entry per effective date
    const existing = cached.find((r) => r.date === json.date)
    if (existing) {
      existing.rates[from] = { ...existing.rates[from], [to]: rate }
    } else {
      cached.push({ date: json.date, rates: { [from]: { [to]: rate } } })
    }
    await storage.saveExchangeRates(cached)

    return rate
  })