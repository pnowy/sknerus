import { createFileRoute } from '@tanstack/react-router'
import { createExpenseHandler, getExpensesHandler } from '@/lib/server/api/handlers/expenses'

export const Route = createFileRoute('/api/v1/expenses')({
  server: {
    handlers: {
      GET: ({ request }) => getExpensesHandler(request),
      POST: ({ request }) => createExpenseHandler(request),
    },
  },
})
