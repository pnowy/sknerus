import { createFileRoute } from '@tanstack/react-router'
import { materializeRecurringHandler } from '@/lib/server/api/handlers/recurring'

export const Route = createFileRoute('/api/v1/recurring/materialize')({
  server: {
    handlers: {
      POST: () => materializeRecurringHandler(),
    },
  },
})
