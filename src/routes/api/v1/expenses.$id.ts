import { createFileRoute } from '@tanstack/react-router'
import { deleteExpenseHandler, getExpenseHandler, patchExpenseHandler, replaceExpenseHandler } from '@/lib/server/api/handlers/expenses'

export const Route = createFileRoute('/api/v1/expenses/$id')({
  server: {
    handlers: {
      GET: ({ params }) => getExpenseHandler(params.id),
      PUT: ({ request, params }) => replaceExpenseHandler(request, params.id),
      PATCH: ({ request, params }) => patchExpenseHandler(request, params.id),
      DELETE: ({ params }) => deleteExpenseHandler(params.id),
    },
  },
})
