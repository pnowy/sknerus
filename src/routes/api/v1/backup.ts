import { createFileRoute } from '@tanstack/react-router'
import { exportBackupHandler, restoreBackupHandler } from '@/lib/server/api/handlers/backup'

export const Route = createFileRoute('/api/v1/backup')({
  server: {
    handlers: {
      GET: () => exportBackupHandler(),
      POST: ({ request }) => restoreBackupHandler(request),
    },
  },
})
