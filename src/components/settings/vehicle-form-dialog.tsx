import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateVehicle, useUpdateVehicle } from '@/hooks/use-vehicles'
import { type VehicleFormInput, vehicleFormSchema } from '@/lib/schemas'
import type { Vehicle } from '@/lib/shared/types/vehicle'
import { FuelType, VEHICLE_EXPENSE_TYPE_LABELS, type VehicleExpenseType, VehicleType } from '@/lib/shared/types/vehicle'
import {
  DEFAULT_EXPENSE_TYPE_COLOR,
  DEFAULT_EXPENSE_TYPE_ICON,
  getExpenseTypeIcon,
  VEHICLE_EXPENSE_ICON_OPTIONS,
} from '@/lib/shared/vehicle-icons'

const EXPENSE_TYPE_ENTRIES = Object.entries(VEHICLE_EXPENSE_TYPE_LABELS) as Array<[VehicleExpenseType, string]>

function buildDefaultNames(vehicle?: Vehicle): Record<VehicleExpenseType, string> {
  return EXPENSE_TYPE_ENTRIES.reduce(
    (acc, [type]) => {
      acc[type] = vehicle?.expenseTypeNames?.[type] ?? ''
      return acc
    },
    {} as Record<VehicleExpenseType, string>
  )
}

function buildDefaultIcons(vehicle?: Vehicle): Record<VehicleExpenseType, string> {
  return EXPENSE_TYPE_ENTRIES.reduce(
    (acc, [type]) => {
      acc[type] = vehicle?.expenseTypeIcons?.[type] ?? DEFAULT_EXPENSE_TYPE_ICON[type] ?? ''
      return acc
    },
    {} as Record<VehicleExpenseType, string>
  )
}

function buildDefaultColors(vehicle?: Vehicle): Record<VehicleExpenseType, string> {
  return EXPENSE_TYPE_ENTRIES.reduce(
    (acc, [type]) => {
      acc[type] = vehicle?.expenseTypeColors?.[type] ?? DEFAULT_EXPENSE_TYPE_COLOR[type]
      return acc
    },
    {} as Record<VehicleExpenseType, string>
  )
}

type Props = {
  vehicle?: Vehicle
  onClose: () => void
}

export function VehicleFormDialog({ vehicle, onClose }: Props) {
  const isEdit = !!vehicle
  const create = useCreateVehicle()
  const update = useUpdateVehicle()
  const isPending = create.isPending || update.isPending

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<VehicleFormInput>({
    // biome-ignore lint/suspicious/noExplicitAny: https://github.com/react-hook-form/resolvers/issues/842
    resolver: zodResolver(vehicleFormSchema as any),
    defaultValues: vehicle
      ? {
          name: vehicle.name,
          type: vehicle.type,
          odometerAtRegistration: vehicle.odometerAtRegistration,
          yearOfProduction: vehicle.yearOfProduction,
          engineSize: vehicle.engineSize,
          fuelTankSize: vehicle.fuelTankSize,
          fuelType: vehicle.fuelType,
          insuranceExpiry: vehicle.insuranceExpiry ?? '',
          technicalInspectionExpiry: vehicle.technicalInspectionExpiry ?? '',
          oilChangeIntervalKm: vehicle.oilChangeIntervalKm,
          oilChangeIntervalMonths: vehicle.oilChangeIntervalMonths,
          expenseTypeNames: buildDefaultNames(vehicle),
          expenseTypeIcons: buildDefaultIcons(vehicle),
          expenseTypeColors: buildDefaultColors(vehicle),
        }
      : {
          name: '',
          type: VehicleType.Car,
          odometerAtRegistration: 0,
          yearOfProduction: new Date().getFullYear(),
          engineSize: 0,
          fuelTankSize: 0,
          fuelType: FuelType.Gasoline,
          insuranceExpiry: '',
          technicalInspectionExpiry: '',
          oilChangeIntervalKm: undefined,
          oilChangeIntervalMonths: undefined,
          expenseTypeNames: buildDefaultNames(),
          expenseTypeIcons: buildDefaultIcons(),
          expenseTypeColors: buildDefaultColors(),
        },
  })

  async function onSubmit(data: VehicleFormInput) {
    const names: Partial<Record<VehicleExpenseType, string>> = {}
    const icons: Partial<Record<VehicleExpenseType, string>> = {}
    const colors: Partial<Record<VehicleExpenseType, string>> = {}
    for (const [type] of EXPENSE_TYPE_ENTRIES) {
      const n = data.expenseTypeNames?.[type]
      if (n) names[type] = n
      const i = data.expenseTypeIcons?.[type]
      if (i) icons[type] = i
      const c = data.expenseTypeColors?.[type]
      if (c && c !== DEFAULT_EXPENSE_TYPE_COLOR[type]) colors[type] = c
    }
    const payload = {
      ...data,
      insuranceExpiry: data.insuranceExpiry || undefined,
      technicalInspectionExpiry: data.technicalInspectionExpiry || undefined,
      oilChangeIntervalKm: data.oilChangeIntervalKm || undefined,
      oilChangeIntervalMonths: data.oilChangeIntervalMonths || undefined,
      expenseTypeNames: Object.keys(names).length > 0 ? names : undefined,
      expenseTypeIcons: Object.keys(icons).length > 0 ? icons : undefined,
      expenseTypeColors: Object.keys(colors).length > 0 ? colors : undefined,
    }
    try {
      if (isEdit && vehicle) {
        await update.mutateAsync({ ...payload, id: vehicle.id })
        toast.success('Vehicle updated')
      } else {
        await create.mutateAsync(payload)
        toast.success('Vehicle added')
      }
      onClose()
    } catch {
      toast.error(isEdit ? 'Failed to update vehicle' : 'Failed to add vehicle')
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" id="vehicle-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1">
            <Label htmlFor="veh-name">Name</Label>
            <Input id="veh-name" placeholder="Kawasaki Z900" {...register('name')} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue>{(v: string) => (v === VehicleType.Car ? 'Car' : 'Motorcycle')}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={VehicleType.Car}>Car</SelectItem>
                      <SelectItem value={VehicleType.Motorcycle}>Motorcycle</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="veh-year">Year of production</Label>
              <Input
                id="veh-year"
                min="1886"
                max={new Date().getFullYear()}
                step="1"
                type="number"
                {...register('yearOfProduction', { valueAsNumber: true })}
              />
              {errors.yearOfProduction && <p className="text-destructive text-xs">{errors.yearOfProduction.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="veh-engine">Engine size (cm³)</Label>
              <Input id="veh-engine" min="1" step="1" type="number" {...register('engineSize', { valueAsNumber: true })} />
              {errors.engineSize && <p className="text-destructive text-xs">{errors.engineSize.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="veh-tank">Fuel tank (liters)</Label>
              <Input id="veh-tank" min="0.1" step="0.1" type="number" {...register('fuelTankSize', { valueAsNumber: true })} />
              {errors.fuelTankSize && <p className="text-destructive text-xs">{errors.fuelTankSize.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="veh-distance">Odometer at registration (km)</Label>
              <Input id="veh-distance" min="0" step="1" type="number" {...register('odometerAtRegistration', { valueAsNumber: true })} />
              {errors.odometerAtRegistration && <p className="text-destructive text-xs">{errors.odometerAtRegistration.message}</p>}
              <p className="text-muted-foreground text-xs">
                Consumption tracking begins from your first full fill-up recorded as a fuel expense.
              </p>
            </div>
            <div className="space-y-1">
              <Label>Fuel type</Label>
              <Controller
                control={control}
                name="fuelType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue>
                        {(v: string) => ({ [FuelType.Gasoline]: 'Gasoline', [FuelType.Diesel]: 'Diesel', [FuelType.Lpg]: 'LPG' })[v] ?? v}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FuelType.Gasoline}>Gasoline</SelectItem>
                      <SelectItem value={FuelType.Diesel}>Diesel</SelectItem>
                      <SelectItem value={FuelType.Lpg}>LPG</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="veh-insurance">Insurance expiry (optional)</Label>
              <Input id="veh-insurance" type="date" {...register('insuranceExpiry')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="veh-inspection">Technical inspection expiry (optional)</Label>
              <Input id="veh-inspection" type="date" {...register('technicalInspectionExpiry')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="veh-oil-km">Oil change interval (km, optional)</Label>
              <Input
                id="veh-oil-km"
                min="1"
                step="1"
                type="number"
                placeholder="e.g. 6000"
                {...register('oilChangeIntervalKm', {
                  setValueAs: (v) => (v === '' || v === null || Number.isNaN(Number(v)) ? undefined : Number(v)),
                })}
              />
              {errors.oilChangeIntervalKm && <p className="text-destructive text-xs">{errors.oilChangeIntervalKm.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="veh-oil-months">Oil change interval (months, optional)</Label>
              <Input
                id="veh-oil-months"
                min="1"
                step="1"
                type="number"
                placeholder="e.g. 12"
                {...register('oilChangeIntervalMonths', {
                  setValueAs: (v) => (v === '' || v === null || Number.isNaN(Number(v)) ? undefined : Number(v)),
                })}
              />
              {errors.oilChangeIntervalMonths && <p className="text-destructive text-xs">{errors.oilChangeIntervalMonths.message}</p>}
            </div>
          </div>
          {!watch('oilChangeIntervalKm') && !watch('oilChangeIntervalMonths') && (
            <p className="text-muted-foreground text-xs">
              Oil change tracking is disabled — set at least one interval (km or months) to get warnings before the next service.
            </p>
          )}
          <div className="space-y-2">
            <Label>Expense type names</Label>
            <p className="text-muted-foreground text-xs">
              Auto-fills the expense name when you select a vehicle expense type. The icon is shown in the transaction list.
            </p>
            <div className="divide-y rounded-lg border">
              {EXPENSE_TYPE_ENTRIES.map(([type, label]) => (
                <div key={type} className="flex items-center gap-3 px-3 py-2">
                  <span className="w-32 shrink-0 text-sm">{label}</span>
                  <Input className="h-7 flex-1 text-sm" placeholder={`e.g. ${label}…`} {...register(`expenseTypeNames.${type}`)} />
                  <Controller
                    control={control}
                    name={`expenseTypeColors.${type}`}
                    render={({ field }) => (
                      <label
                        className="relative size-7 shrink-0 cursor-pointer rounded-full border-2 border-black/20 transition-transform hover:scale-110 dark:border-white/20"
                        style={{ backgroundColor: field.value || DEFAULT_EXPENSE_TYPE_COLOR[type] }}
                        aria-label={`Color for ${label}`}
                      >
                        <input
                          className="sr-only"
                          type="color"
                          value={field.value || DEFAULT_EXPENSE_TYPE_COLOR[type]}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </label>
                    )}
                  />
                  <Controller
                    control={control}
                    name={`expenseTypeIcons.${type}`}
                    render={({ field }) => (
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger size="sm" className="shrink-0" aria-label="Icon">
                          <SelectValue>
                            {(v: string) => {
                              const ValueIcon = getExpenseTypeIcon(v)
                              return ValueIcon ? <ValueIcon className="size-4" /> : null
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {VEHICLE_EXPENSE_ICON_OPTIONS.map((o) => {
                            const OptionIcon = getExpenseTypeIcon(o.value)
                            return (
                              <SelectItem key={o.value} value={o.value} aria-label={o.label}>
                                {OptionIcon && <OptionIcon className="size-4" />}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isPending} form="vehicle-form" type="submit">
            {isPending ? 'Saving...' : isEdit ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
