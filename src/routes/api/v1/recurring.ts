import { createFileRoute } from '@tanstack/react-router'
import { createRecurringHandler, getRecurringHandler } from '@/lib/server/api/handlers/recurring'

export const Route = createFileRoute('/api/v1/recurring')({
  server: {
    handlers: {
      GET: () => getRecurringHandler(),
      POST: ({ request }) => createRecurringHandler(request),
    },
  },
})
