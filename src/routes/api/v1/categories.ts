import { createFileRoute } from '@tanstack/react-router'
import { getCategoriesHandler } from '@/lib/server/api/handlers/config'

export const Route = createFileRoute('/api/v1/categories')({
  server: {
    handlers: {
      GET: () => getCategoriesHandler(),
    },
  },
})
