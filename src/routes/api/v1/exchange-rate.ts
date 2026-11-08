import { createFileRoute } from '@tanstack/react-router'
import { getExchangeRateHandler } from '@/lib/server/api/handlers/exchange-rate'

export const Route = createFileRoute('/api/v1/exchange-rate')({
  server: {
    handlers: {
      GET: ({ request }) => getExchangeRateHandler(request),
    },
  },
})
