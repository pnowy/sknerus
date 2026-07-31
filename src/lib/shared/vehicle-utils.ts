import { addMonths, format, parseISO } from 'date-fns'
import { daysUntil, generateWeekEndings } from './date-utils'
import { compareExpensesByDate } from './expense-utils'
import type { Expense } from './types/expense'
import type { Vehicle } from './types/vehicle'
import { VehicleExpenseType } from './types/vehicle'

type FuelStats = { burned: number; distance: number; consumption: number }

function calcFuelStats(vehicle: Vehicle, expenses: Array<Expense>): FuelStats | null {
  const allFuelEntries = expenses.filter(
    (e) => e.vehicleExpense?.vehicleId === vehicle.id && e.vehicleExpense.expenseType === VehicleExpenseType.Fuel
  )
  if (allFuelEntries.length === 0) return null

  const sorted = [...allFuelEntries].sort((a, b) => compareExpensesByDate(a, b))

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

export type ExpirySeverity = 'ok' | 'warn' | 'crit'

function daysSeverity(days: number): ExpirySeverity {
  if (days < 0 || days <= 7) return 'crit'
  if (days <= 30) return 'warn'
  return 'ok'
}

function kmSeverity(km: number): ExpirySeverity {
  if (km < 0) return 'crit'
  if (km <= 500) return 'warn'
  return 'ok'
}

function worstSeverity(...severities: Array<ExpirySeverity>): ExpirySeverity {
  if (severities.includes('crit')) return 'crit'
  if (severities.includes('warn')) return 'warn'
  return 'ok'
}

function formatDays(days: number): string {
  if (days < 0) {
    const abs = Math.abs(days)
    return `expired ${abs > 30 ? `${Math.floor(abs / 30)}mo` : `${abs}d`} ago`
  }
  if (days > 30) return `${Math.floor(days / 30)}mo left`
  return `${days}d left`
}

function formatKm(km: number): string {
  return km < 0 ? `overdue by ${Math.abs(km).toLocaleString()} km` : `${km.toLocaleString()} km left`
}

export type ExpiryStatus = { severity: ExpirySeverity; text: string }

export function expiryStatus(isoDate: string): ExpiryStatus {
  const days = daysUntil(isoDate)
  return { severity: daysSeverity(days), text: formatDays(days) }
}

export type OilChangeStatus = { severity: ExpirySeverity; parts: Array<string> }

export function oilChangeStatus(vehicle: Vehicle, expenses: Array<Expense>): OilChangeStatus | null {
  const isoDate = nextOilChangeDate(vehicle, expenses)
  const km = kmUntilNextOilChange(vehicle, expenses)
  if (!isoDate && km == null) return null
  const days = isoDate ? daysUntil(isoDate) : null
  const severity = worstSeverity(days != null ? daysSeverity(days) : 'ok', km != null ? kmSeverity(km) : 'ok')
  const parts = [days != null && formatDays(days), km != null && formatKm(km)].filter(Boolean) as Array<string>
  return { severity, parts }
}

function latestOilChange(vehicle: Vehicle, expenses: Array<Expense>): Expense | null {
  const entries = expenses.filter(
    (e) => e.vehicleExpense?.vehicleId === vehicle.id && e.vehicleExpense.expenseType === VehicleExpenseType.OilChange
  )
  if (entries.length === 0) return null
  return entries.reduce((best, e) => {
    if (e.date > best.date) return e
    if (e.date < best.date) return best
    const bestOdo = best.vehicleExpense?.odometerReading ?? -1
    const eOdo = e.vehicleExpense?.odometerReading ?? -1
    return eOdo > bestOdo ? e : best
  })
}

export function nextOilChangeDate(vehicle: Vehicle, expenses: Array<Expense>): string | null {
  if (!vehicle.oilChangeIntervalMonths) return null
  const latest = latestOilChange(vehicle, expenses)
  if (!latest) return null
  return format(addMonths(parseISO(latest.date), vehicle.oilChangeIntervalMonths), 'yyyy-MM-dd')
}

export type VehicleSpendWeekRow = { week: string } & Partial<Record<VehicleExpenseType, number>>

export function vehicleSpendBreakdownByWeek(vehicle: Vehicle, expenses: Array<Expense>): Array<VehicleSpendWeekRow> {
  const entries = expenses.filter((e) => e.vehicleExpense?.vehicleId === vehicle.id).sort((a, b) => compareExpensesByDate(a, b))
  if (entries.length === 0) return []

  const weekEndings = generateWeekEndings(entries[0].date)
  const cumulative: Partial<Record<VehicleExpenseType, number>> = {}
  const rows: Array<VehicleSpendWeekRow> = []
  let idx = 0

  for (const week of weekEndings) {
    while (idx < entries.length && entries[idx].date <= week) {
      const type = entries[idx].vehicleExpense?.expenseType
      if (type) cumulative[type] = (cumulative[type] ?? 0) + Math.abs(entries[idx].amount)
      idx++
    }
    rows.push({ week, ...cumulative })
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
