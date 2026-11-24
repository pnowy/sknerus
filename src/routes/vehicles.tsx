import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent } from '@/components/ui/card'
import { VehicleList } from '@/components/vehicles/vehicle-list'
import { useConfig, useExpenses } from '@/hooks/use-expenses'
import { useVehicles } from '@/hooks/use-vehicles'
import { getConfig, getExpenses, getVehicles } from '@/lib/api'

export const Route = createFileRoute('/vehicles')({
  loader: async ({ context: { queryClient } }) => {
    const config = await queryClient.ensureQueryData({ queryKey: ['config'], queryFn: () => getConfig() })
    if (!config.features?.vehicleExpenseTracking) throw redirect({ to: '/settings' })
    await Promise.all([
      queryClient.ensureQueryData({ queryKey: ['vehicles'], queryFn: () => getVehicles() }),
      queryClient.ensureQueryData({ queryKey: ['expenses'], queryFn: () => getExpenses() }),
    ])
  },
  component: VehiclesPage,
})

function VehiclesPage() {
  const { data: config } = useConfig()
  const { data: vehicles = [] } = useVehicles()
  const { data: expenses = [] } = useExpenses()
  if (!config) return null

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">Vehicles</h1>
        <Card>
          <CardContent>
            <VehicleList currency={config.currency} expenses={expenses} vehicles={vehicles} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
