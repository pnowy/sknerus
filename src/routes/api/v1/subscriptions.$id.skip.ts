import { createFileRoute } from '@tanstack/react-router'
import { skipRenewalHandler } from '@/lib/server/api/handlers/subscriptions'

export const Route = createFileRoute('/api/v1/subscriptions/$id/skip')({
  server: {
    handlers: {
      POST: ({ request, params }) => skipRenewalHandler(request, params.id),
    },
  },
})
