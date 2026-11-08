import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createVehicle, deleteVehicle, getVehicles, updateVehicle } from '@/lib/api'
import type { VehicleInput } from '@/lib/schemas'
import type { Vehicle } from '@/lib/shared/types/vehicle'

export const vehicleQueryKeys = {
  vehicles: ['vehicles'] as const,
}

export function useVehicles() {
  return useQuery({
    queryKey: vehicleQueryKeys.vehicles,
    queryFn: () => getVehicles(),
  })
}

export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<VehicleInput, 'id'>) => createVehicle(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: vehicleQueryKeys.vehicles }),
  })
}

export function useUpdateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Vehicle) => updateVehicle(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: vehicleQueryKeys.vehicles }),
  })
}

export function useDeleteVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleQueryKeys.vehicles })
      qc.invalidateQueries({ queryKey: ['config'] })
      qc.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}
