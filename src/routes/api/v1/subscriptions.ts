import { createFileRoute } from '@tanstack/react-router'
import { createSubscriptionHandler, getSubscriptionsHandler } from '@/lib/server/api/handlers/subscriptions'

export const Route = createFileRoute('/api/v1/subscriptions')({
  server: {
    handlers: {
      GET: () => getSubscriptionsHandler(),
      POST: ({ request }) => createSubscriptionHandler(request),
    },
  },
})
