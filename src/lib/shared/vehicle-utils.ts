import { addMonths, format, parseISO } from 'date-fns'
import type { Expense } from './types/expense'
import type { Vehicle } from './types/vehicle'
import { VehicleExpenseType } from './types/vehicle'

type FuelStats = { burned: number; distance: number; consumption: number }

function calcFuelStats(vehicle: Vehicle, expenses: Array<Expense>): FuelStats | null {
  const allFuelEntries = expenses.filter(
    (e) => e.vehicleExpense?.vehicleId === vehicle.id && e.vehicleExpense.expenseType === VehicleExpenseType.Fuel
  )
  if (allFuelEntries.length === 0) return null

  const sorted = [...allFuelEntries].sort((a, b) => a.date.localeCompare(b.date))

  // first establish the baseline regardless of odometer state during registration (as fuel tank when we first buy vehicle could have random state)
  const baselineFill = sorted.find((e) => e.vehicleExpense?.fuelLevelPercent === 100 && e.vehicleExpense.odometerReading != null)
  if (!baselineFill) return null

  const baselineDistance = baselineFill.vehicleExpense?.odometerReading ?? 0
  const baselineIdx = sorted.indexOf(baselineFill)
  const relevantEntries = sorted.slice(baselineIdx + 1)
  if (relevantEntries.length === 0) return null

  const totalFuelAdded = relevantEntries.reduce((sum, e) => sum + (e.vehicleExpense?.fuelLiters ?? 0), 0)
  const distanceEntries = relevantEntries.filter((e) => e.vehicleExpense?.odometerReading != null)
  if (distanceEntries.length === 0) return null

  const latestEntry = distanceEntries.reduce((best, e) => {
    const bestDist = best.vehicleExpense?.odometerReading ?? 0
    const eDist = e.vehicleExpense?.odometerReading ?? 0
    if (eDist > bestDist) return e
    if (eDist === bestDist && e.date > best.date) return e
    return best
  })

  const fuelInTank = vehicle.fuelTankSize * ((latestEntry.vehicleExpense?.fuelLevelPercent ?? 0) / 100)
  const burned = vehicle.fuelTankSize + totalFuelAdded - fuelInTank
  if (burned <= 0) return null

  const distance = (latestEntry.vehicleExpense?.odometerReading ?? 0) - baselineDistance
  if (distance <= 0) return null

  const litersPer100km = (burned / distance) * 100
  const consumption = Math.round(litersPer100km * 100) / 100
  return { burned: Math.round(burned * 100) / 100, distance, consumption }
}

export function calcFuelConsumption(vehicle: Vehicle, expenses: Array<Expense>): number | null {
  return calcFuelStats(vehicle, expenses)?.consumption ?? null
}

export function calcFuelBurned(vehicle: Vehicle, expenses: Array<Expense>): number | null {
  return calcFuelStats(vehicle, expenses)?.burned ?? null
}

export function daysUntilExpiry(isoDate: string): number {
  return Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86_400_000)
}

function latestOilChange(vehicle: Vehicle, expenses: Array<Expense>): Expense | null {
  const entries = expenses.filter(
    (e) => e.vehicleExpense?.vehicleId === vehicle.id && e.vehicleExpense.expenseType === VehicleExpenseType.OilChange
  )
  if (entries.length === 0) return null
  return entries.reduce((best, e) => (e.date > best.date ? e : best))
}

export function nextOilChangeDate(vehicle: Vehicle, expenses: Array<Expense>): string | null {
  if (!vehicle.oilChangeIntervalMonths) return null
  const latest = latestOilChange(vehicle, expenses)
  if (!latest) return null
  return format(addMonths(parseISO(latest.date), vehicle.oilChangeIntervalMonths), 'yyyy-MM-dd')
}

export type VehicleSpendWeekRow = { week: string } & Partial<Record<VehicleExpenseType, number>>

export function vehicleSpendBreakdownByWeek(vehicle: Vehicle, expenses: Array<Expense>): Array<VehicleSpendWeekRow> {
  const entries = expenses.filter((e) => e.vehicleExpense?.vehicleId === vehicle.id).sort((a, b) => a.date.localeCompare(b.date))
  if (entries.length === 0) return []

  const WEEK_MS = 7 * 86_400_000
  const firstDate = new Date(entries[0].date)
  const today = new Date()
  const weekCount = Math.max(1, Math.ceil((today.getTime() - firstDate.getTime()) / WEEK_MS) + 1)

  const cumulative: Partial<Record<VehicleExpenseType, number>> = {}
  const rows: Array<VehicleSpendWeekRow> = []
  let idx = 0

  for (let i = 0; i < weekCount; i++) {
    const weekEnd = new Date(firstDate.getTime() + (i + 1) * WEEK_MS)
    while (idx < entries.length && new Date(entries[idx].date) <= weekEnd) {
      const e = entries[idx]
      const type = e.vehicleExpense?.expenseType
      if (type) cumulative[type] = (cumulative[type] ?? 0) + Math.abs(e.amount)
      idx++
    }
    rows.push({ week: weekEnd.toISOString().slice(0, 10), ...cumulative })
  }
  return rows
}

export function kmUntilNextOilChange(vehicle: Vehicle, expenses: Array<Expense>): number | null {
  if (!vehicle.oilChangeIntervalKm) return null

  const vehicleEntries = expenses.filter((e) => e.vehicleExpense?.vehicleId === vehicle.id)
  const allOdometerReadings = vehicleEntries.map((e) => e.vehicleExpense?.odometerReading).filter((v): v is number => v != null)
  const currentOdometer = allOdometerReadings.length > 0 ? Math.max(...allOdometerReadings) : vehicle.odometerAtRegistration

  const latest = latestOilChange(vehicle, expenses)
  const lastOilChangeOdometer = latest?.vehicleExpense?.odometerReading ?? vehicle.odometerAtRegistration

  return lastOilChangeOdometer + vehicle.oilChangeIntervalKm - currentOdometer
}
