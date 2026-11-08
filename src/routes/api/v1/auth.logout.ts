import { createFileRoute } from '@tanstack/react-router'
import { logoutHandler } from '@/lib/server/api/handlers/auth'

export const Route = createFileRoute('/api/v1/auth/logout')({
  server: {
    handlers: {
      POST: ({ request }) => logoutHandler(request),
    },
  },
})
