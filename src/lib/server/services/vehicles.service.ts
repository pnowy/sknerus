import { genVehicleId } from '@/lib/server/ids.server'
import { NotFoundError } from '@/lib/server/services/errors'
import { withWriteLock } from '@/lib/server/services/lock'
import { storage } from '@/lib/server/storage'
import type { Vehicle } from '@/lib/shared/types/vehicle'

export async function listVehicles(): Promise<Array<Vehicle>> {
  return storage.getVehicles()
}

export function createVehicle(data: Omit<Vehicle, 'id'>): Promise<Vehicle> {
  return withWriteLock(async () => {
    const vehicles = await storage.getVehicles()
    const newVehicle: Vehicle = { ...data, id: genVehicleId() }
    await storage.saveVehicles([...vehicles, newVehicle])
    return newVehicle
  })
}

export function updateVehicle(data: Vehicle): Promise<Vehicle> {
  return withWriteLock(async () => {
    const vehicles = await storage.getVehicles()
    const idx = vehicles.findIndex((vehicle) => vehicle.id === data.id)
    if (idx === -1) throw new NotFoundError('Vehicle not found')
    vehicles[idx] = data
    await storage.saveVehicles(vehicles)
    return data
  })
}

export function removeVehicle(id: string): Promise<{ success: true }> {
  return withWriteLock(async () => {
    const [vehicles, config, expenses] = await Promise.all([storage.getVehicles(), storage.getConfig(), storage.getExpenses()])

    const nextVehicles = vehicles.filter((vehicle) => vehicle.id !== id)
    const nextCategories = config.categories.map((category) =>
      category.vehicleId === id ? { ...category, vehicleId: undefined } : category
    )
    const categoriesChanged = nextCategories.some((category, index) => category.vehicleId !== config.categories[index].vehicleId)

    let expensesChanged = false
    const nextExpenses = expenses.map((expense) => {
      if (expense.vehicleExpense?.vehicleId === id) {
        expensesChanged = true
        const { vehicleExpense: _ignored, ...rest } = expense
        return rest
      }
      return expense
    })

    await storage.saveVehicles(nextVehicles)
    if (categoriesChanged) await storage.saveConfig({ ...config, categories: nextCategories })
    if (expensesChanged) await storage.saveExpenses(nextExpenses)
    return { success: true }
  })
}
