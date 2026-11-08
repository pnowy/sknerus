import { createFileRoute } from '@tanstack/react-router'
import { createVehicleHandler, getVehiclesHandler } from '@/lib/server/api/handlers/vehicles'

export const Route = createFileRoute('/api/v1/vehicles')({
  server: {
    handlers: {
      GET: () => getVehiclesHandler(),
      POST: ({ request }) => createVehicleHandler(request),
    },
  },
})
