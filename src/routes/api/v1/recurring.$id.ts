import { createFileRoute } from '@tanstack/react-router'
import { deleteRecurringHandler, updateRecurringHandler } from '@/lib/server/api/handlers/recurring'

export const Route = createFileRoute('/api/v1/recurring/$id')({
  server: {
    handlers: {
      PUT: ({ request, params }) => updateRecurringHandler(request, params.id),
      DELETE: ({ request, params }) => deleteRecurringHandler(request, params.id),
    },
  },
})
