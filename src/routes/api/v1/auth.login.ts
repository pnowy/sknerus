import { createFileRoute } from '@tanstack/react-router'
import { loginHandler } from '@/lib/server/api/handlers/auth'

export const Route = createFileRoute('/api/v1/auth/login')({
  server: {
    handlers: {
      POST: ({ request }) => loginHandler(request),
    },
  },
})
