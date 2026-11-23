import { createFileRoute } from '@tanstack/react-router'
import { bookPaymentHandler } from '@/lib/server/api/handlers/subscriptions'

export const Route = createFileRoute('/api/v1/subscriptions/$id/book')({
  server: {
    handlers: {
      POST: ({ request, params }) => bookPaymentHandler(request, params.id),
    },
  },
})
