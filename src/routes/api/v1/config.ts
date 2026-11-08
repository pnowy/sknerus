import { createFileRoute } from '@tanstack/react-router'
import { getConfigHandler, updateConfigHandler } from '@/lib/server/api/handlers/config'

export const Route = createFileRoute('/api/v1/config')({
  server: {
    handlers: {
      GET: () => getConfigHandler(),
      PUT: ({ request }) => updateConfigHandler(request),
    },
  },
})
