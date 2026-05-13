import { BarChart2, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { VehicleFormDialog } from '@/components/settings/vehicle-form-dialog'
import { VehicleFuelHistoryDialog } from '@/components/settings/vehicle-fuel-history-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDeleteVehicle } from '@/hooks/use-vehicles'
import type { Expense } from '@/lib/shared/types/expense'
import type { Vehicle } from '@/lib/shared/types/vehicle'
import { calcFuelConsumption, daysUntilExpiry } from '@/lib/shared/vehicle-utils'
import { cn } from '@/lib/utils'

type Props = {
  vehicles: Array<Vehicle>
  expenses: Array<Expense>
  currency: string
}

function ExpiryInfo({ label, isoDate }: { label: string; isoDate: string }) {
  const days = daysUntilExpiry(isoDate)

  let timeText: string
  if (days < 0) {
    const abs = Math.abs(days)
    timeText = `expired ${abs > 30 ? `${Math.floor(abs / 30)}mo` : `${abs}d`} ago`
  } else if (days > 30) {
    timeText = `${Math.floor(days / 30)}mo left`
  } else {
    timeText = `${days}d left`
  }

  return (
    <span className={cn('text-xs', days < 0 || days <= 7 ? 'text-destructive' : days <= 30 ? 'text-yellow-500' : 'text-muted-foreground')}>
      {label}: {timeText}
    </span>
  )
}

export function VehicleList({ vehicles, expenses, currency }: Props) {
  const deleteVehicle = useDeleteVehicle()
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [historyVehicle, setHistoryVehicle] = useState<Vehicle | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  async function handleDelete(vehicle: Vehicle) {
    try {
      await deleteVehicle.mutateAsync(vehicle.id)
      toast.success(`${vehicle.name} deleted`)
    } catch {
      toast.error('Failed to delete vehicle')
    }
  }

  return (
    <div className="space-y-3">
      {vehicles.length === 0 && <p className="text-muted-foreground text-sm">No vehicles added yet.</p>}
      {vehicles.map((v) => {
        const consumption = calcFuelConsumption(v, expenses)
        return (
          <div key={v.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-sm">{v.name}</span>
                <Badge variant="secondary" className="text-xs capitalize">
                  {v.type}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                {v.yearOfProduction} · {v.engineSize} cm³ · {v.fuelTankSize} L ·{' '}
                <button type="button" className="font-medium underline-offset-2 hover:underline" onClick={() => setHistoryVehicle(v)}>
                  {consumption != null ? `${consumption} L/100km` : '— L/100km'}
                </button>
              </p>
              {(v.insuranceExpiry || v.technicalInspectionExpiry) && (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {v.insuranceExpiry && <ExpiryInfo label="Insurance" isoDate={v.insuranceExpiry} />}
                  {v.technicalInspectionExpiry && <ExpiryInfo label="Inspection" isoDate={v.technicalInspectionExpiry} />}
                </div>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button size="icon" variant="ghost" onClick={() => setHistoryVehicle(v)}>
                <BarChart2 className="size-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setEditingVehicle(v)}>
                <Pencil className="size-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(v)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        )
      })}
      <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
        Add vehicle
      </Button>
      {addOpen && <VehicleFormDialog onClose={() => setAddOpen(false)} />}
      {editingVehicle && <VehicleFormDialog vehicle={editingVehicle} onClose={() => setEditingVehicle(null)} />}
      {historyVehicle && (
        <VehicleFuelHistoryDialog
          currency={currency}
          expenses={expenses}
          vehicle={historyVehicle}
          onClose={() => setHistoryVehicle(null)}
        />
      )}
    </div>
  )
}
