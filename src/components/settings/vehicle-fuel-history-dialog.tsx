import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/shared/format'
import type { Expense } from '@/lib/shared/types/expense'
import type { Vehicle } from '@/lib/shared/types/vehicle'
import { calcFuelBurned, calcFuelConsumption } from '@/lib/shared/vehicle-utils'

type Props = {
  vehicle: Vehicle
  expenses: Array<Expense>
  currency: string
  onClose: () => void
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-4 py-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-0.5 font-semibold text-sm">{value}</p>
    </div>
  )
}

export function VehicleFuelHistoryDialog({ vehicle, expenses, currency, onClose }: Props) {
  const fuelEntries = expenses.filter((e) => e.vehicleExpense?.vehicleId === vehicle.id).sort((a, b) => b.date.localeCompare(a.date))

  const totalLiters = fuelEntries.reduce((sum, e) => sum + (e.vehicleExpense?.fuelLiters ?? 0), 0)
  const totalCost = fuelEntries.reduce((sum, e) => sum + Math.abs(e.amount), 0)
  const costPerLiter = totalLiters > 0 ? totalCost / totalLiters : null

  const mileageEntries = fuelEntries.filter((e) => e.vehicleExpense?.odometerReading != null)
  const latestMileage = mileageEntries.length > 0 ? Math.max(...mileageEntries.map((e) => e.vehicleExpense?.odometerReading ?? 0)) : null
  const distanceTracked = latestMileage != null ? latestMileage - vehicle.odometerAtRegistration : null

  const totalBurned = calcFuelBurned(vehicle, expenses)
  const avgConsumption = calcFuelConsumption(vehicle, expenses)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fuel History — {vehicle.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard label="Avg. consumption" value={avgConsumption != null ? `${avgConsumption} L/100km` : '—'} />
          <StatCard label="Total burned" value={totalBurned != null ? `${totalBurned.toFixed(2)} L` : '—'} />
          <StatCard label="Distance tracked" value={distanceTracked != null ? `${distanceTracked.toLocaleString()} km` : '—'} />
          <StatCard label="Cost per liter" value={costPerLiter != null ? formatCurrency(costPerLiter, currency) : '—'} />
        </div>

        <Separator />

        {fuelEntries.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-sm">No fuel entries yet.</p>
        ) : (
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-2 pr-3">
              {fuelEntries.map((entry) => {
                const ve = entry.vehicleExpense
                if (!ve) return null
                return (
                  <div key={entry.id} className="flex items-start justify-between gap-4 rounded-lg border px-3 py-2.5">
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-medium text-sm">{formatDate(entry.date)}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground text-xs">
                        <span>+{ve.fuelLiters} L</span>
                        <span>{ve.fuelLevelPercent}% after</span>
                        {ve.odometerReading != null && <span>{ve.odometerReading.toLocaleString()} km distance</span>}
                      </div>
                    </div>
                    <p className="shrink-0 font-medium text-sm">{formatCurrency(Math.abs(entry.amount), currency)}</p>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}

        {fuelEntries.length > 0 && (
          <>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {fuelEntries.length} fill-ups · {totalLiters.toFixed(2)} L total
              </span>
              <span className="font-medium">{formatCurrency(totalCost, currency)}</span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
