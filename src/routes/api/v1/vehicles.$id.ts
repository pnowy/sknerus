import { createFileRoute } from '@tanstack/react-router'
import { deleteVehicleHandler, updateVehicleHandler } from '@/lib/server/api/handlers/vehicles'

export const Route = createFileRoute('/api/v1/vehicles/$id')({
  server: {
    handlers: {
      PUT: ({ request, params }) => updateVehicleHandler(request, params.id),
      DELETE: ({ request, params }) => deleteVehicleHandler(request, params.id),
    },
  },
})
