import { createFileRoute } from '@tanstack/react-router'
import { deleteSubscriptionHandler, updateSubscriptionHandler } from '@/lib/server/api/handlers/subscriptions'

export const Route = createFileRoute('/api/v1/subscriptions/$id')({
  server: {
    handlers: {
      PUT: ({ request, params }) => updateSubscriptionHandler(request, params.id),
      DELETE: ({ request, params }) => deleteSubscriptionHandler(request, params.id),
    },
  },
})
