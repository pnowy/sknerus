import { BarChart2, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { VehicleFormDialog } from '@/components/settings/vehicle-form-dialog'
import { VehicleStatsDialog } from '@/components/settings/vehicle-stats-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDeleteVehicle } from '@/hooks/use-vehicles'
import type { Expense } from '@/lib/shared/types/expense'
import type { Vehicle } from '@/lib/shared/types/vehicle'
import { calcFuelConsumption, type ExpirySeverity, expiryStatus, type OilChangeStatus, oilChangeStatus } from '@/lib/shared/vehicle-utils'
import { cn } from '@/lib/utils'

type Props = {
  vehicles: Array<Vehicle>
  expenses: Array<Expense>
  currency: string
}

function severityClass(s: ExpirySeverity): string {
  return s === 'crit' ? 'text-destructive' : s === 'warn' ? 'text-yellow-500' : 'text-muted-foreground'
}

function ExpiryInfo({ label, isoDate }: { label: string; isoDate: string }) {
  const { severity, text } = expiryStatus(isoDate)
  return (
    <span className={cn('text-xs', severityClass(severity))}>
      {label}: {text}
    </span>
  )
}

function OilChangeInfo({ status }: { status: OilChangeStatus | null }) {
  if (!status) return null
  return <span className={cn('text-xs', severityClass(status.severity))}>Oil change: {status.parts.join(' · ')}</span>
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
        const oilStatus = oilChangeStatus(v, expenses)
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
              {(v.insuranceExpiry || v.technicalInspectionExpiry || oilStatus) && (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {v.insuranceExpiry && <ExpiryInfo label="Insurance" isoDate={v.insuranceExpiry} />}
                  {v.technicalInspectionExpiry && <ExpiryInfo label="Inspection" isoDate={v.technicalInspectionExpiry} />}
                  <OilChangeInfo status={oilStatus} />
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
        <VehicleStatsDialog currency={currency} expenses={expenses} vehicle={historyVehicle} onClose={() => setHistoryVehicle(null)} />
      )}
    </div>
  )
}
