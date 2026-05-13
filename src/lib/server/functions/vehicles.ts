import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { vehicleSchema } from '@/lib/schemas'
import { genVehicleId } from '@/lib/server/ids.server'
import { storage } from '@/lib/server/storage'
import type { Vehicle } from '@/lib/shared/types/vehicle'

export const getVehicles = createServerFn({ method: 'GET' }).handler(() => storage.getVehicles())

export const createVehicle = createServerFn({ method: 'POST' })
  .inputValidator(vehicleSchema.omit({ id: true }))
  .handler(async ({ data }) => {
    const vehicles = await storage.getVehicles()
    const newVehicle: Vehicle = { ...data, id: genVehicleId() }
    await storage.saveVehicles([...vehicles, newVehicle])
    return newVehicle
  })

export const updateVehicle = createServerFn({ method: 'POST' })
  .inputValidator(vehicleSchema)
  .handler(async ({ data }) => {
    const vehicles = await storage.getVehicles()
    const idx = vehicles.findIndex((v) => v.id === data.id)
    if (idx === -1) throw new Error('Vehicle not found')
    vehicles[idx] = data
    await storage.saveVehicles(vehicles)
    return data
  })

export const deleteVehicle = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const vehicles = await storage.getVehicles()
    await storage.saveVehicles(vehicles.filter((v) => v.id !== data.id))
    return { success: true }
  })
