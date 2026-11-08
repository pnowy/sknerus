import { createFileRoute } from '@tanstack/react-router'
import { authStatusHandler } from '@/lib/server/api/handlers/auth'

export const Route = createFileRoute('/api/v1/auth/status')({
  server: {
    handlers: {
      GET: () => authStatusHandler(),
    },
  },
})
