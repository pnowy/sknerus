import { z } from 'zod'
import { handleErrors, jsonResponse } from '@/lib/server/api/http'
import { resolveExchangeRate } from '@/lib/server/services/exchange-rates.service'

const exchangeRateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  from: z.string().min(1),
  to: z.string().min(1),
})

export const getExchangeRateHandler = handleErrors(async (request: Request) => {
  const url = new URL(request.url)
  const query = exchangeRateQuerySchema.parse({
    date: url.searchParams.get('date'),
    from: url.searchParams.get('from'),
    to: url.searchParams.get('to'),
  })
  return jsonResponse(await resolveExchangeRate(query.date, query.from, query.to))
})
