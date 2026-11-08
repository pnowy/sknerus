import { createFileRoute } from '@tanstack/react-router'
import { renameCategoryHandler } from '@/lib/server/api/handlers/config'

export const Route = createFileRoute('/api/v1/categories/$id/rename')({
  server: {
    handlers: {
      POST: ({ request, params }) => renameCategoryHandler(request, params.id),
    },
  },
})
