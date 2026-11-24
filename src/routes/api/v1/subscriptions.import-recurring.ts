import { createFileRoute } from '@tanstack/react-router'
import { importRecurringSubscriptionsHandler } from '@/lib/server/api/handlers/subscriptions'

export const Route = createFileRoute('/api/v1/subscriptions/import-recurring')({
  server: {
    handlers: {
      POST: ({ request }) => importRecurringSubscriptionsHandler(request),
    },
  },
})
