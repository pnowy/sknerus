import { describe, expect, it } from 'vitest'
import type { Expense } from './types/expense'
import type { Vehicle } from './types/vehicle'
import { FuelType, VehicleExpenseType, VehicleType } from './types/vehicle'
import { calcFuelConsumption, daysUntilExpiry } from './vehicle-utils'

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'veh_test',
    name: 'Test Vehicle',
    type: VehicleType.Car,
    odometerAtRegistration: 0,
    yearOfProduction: 2020,
    engineSize: 1600,
    fuelTankSize: 50,
    fuelType: FuelType.Gasoline,
    ...overrides,
  }
}

function makeFuelExpense(
  fuelLiters: number,
  odometerReading?: number,
  fuelLevelPercent = 100,
  vehicleId = 'veh_test',
  date = '2024-01-01'
): Expense {
  return {
    id: `exp_${Math.random()}`,
    name: 'Fuel',
    amount: -100,
    currency: 'USD',
    categoryId: 'cat_1',
    date,
    tags: [],
    vehicleExpense: { vehicleId, expenseType: VehicleExpenseType.Fuel, fuelLiters, odometerReading, fuelLevelPercent },
  }
}

describe('calcFuelConsumption', () => {
  describe('when there are no fuel expenses', () => {
    it('should return null', () => {
      expect(calcFuelConsumption(makeVehicle(), [])).toBeNull()
    })
  })

  describe('when no expense has a odometerReading', () => {
    it('should return null', () => {
      expect(calcFuelConsumption(makeVehicle(), [makeFuelExpense(40), makeFuelExpense(30)])).toBeNull()
    })
  })

  describe('when only the baseline fill exists and nothing after it', () => {
    it('should return null', () => {
      const vehicle = makeVehicle({ fuelTankSize: 17 })
      expect(calcFuelConsumption(vehicle, [makeFuelExpense(15, 1, 100)])).toBeNull()
    })
  })

  describe('when no full fill with a distance exists to serve as baseline', () => {
    it('should return null', () => {
      const vehicle = makeVehicle({ fuelTankSize: 17 })
      expect(calcFuelConsumption(vehicle, [makeFuelExpense(15, 1, 70)])).toBeNull()
    })
  })

  describe('when there is a baseline and one subsequent full-tank fill', () => {
    it('should calculate L/100km correctly', () => {
      // baseline: 15L at 0km, full — subsequent: 9.41L at 115km, full
      // burned = 17 + 9.41 - 17 = 9.41 / 115 * 100 = 8.18 L/100km
      const vehicle = makeVehicle({ fuelTankSize: 17 })
      const expenses = [makeFuelExpense(15, 0, 100, 'veh_test', '2024-01-01'), makeFuelExpense(9.41, 115, 100, 'veh_test', '2024-02-01')]
      expect(calcFuelConsumption(vehicle, expenses)).toBe(8.18)
    })
  })

  describe('when the latest fill is at 50% tank level', () => {
    it('should account for remaining fuel when calculating burned', () => {
      // baseline: 30L at 0km, full — subsequent: 20L at 300km, 50% (25L remaining)
      // burned = 50 + 20 - 25 = 45 / 300 * 100 = 15.00 L/100km
      const vehicle = makeVehicle({ fuelTankSize: 50 })
      const expenses = [makeFuelExpense(30, 0, 100, 'veh_test', '2024-01-01'), makeFuelExpense(20, 300, 50, 'veh_test', '2024-02-01')]
      expect(calcFuelConsumption(vehicle, expenses)).toBe(15)
    })
  })

  describe('when the real-world scenario: received vehicle, first full fill, then subsequent fill', () => {
    it('should calculate from baseline onwards and ignore the baseline liters', () => {
      // baseline: 15L at 1km, full (first fill at the station)
      // after: 10L at 200km, full
      // burned = 17 + 10 - 17 = 10L / (200-1)km → 5.03 L/100km
      const vehicle = makeVehicle({ fuelTankSize: 17 })
      const expenses = [makeFuelExpense(15, 1, 100, 'veh_test', '2024-01-01'), makeFuelExpense(10, 200, 100, 'veh_test', '2024-02-01')]
      expect(calcFuelConsumption(vehicle, expenses)).toBe(5.03)
    })
  })

  describe('when multiple entries have distance', () => {
    it('should use the entry with the highest distance as the latest reference', () => {
      const vehicle = makeVehicle({ fuelTankSize: 17 })
      const expenses = [
        makeFuelExpense(15, 1, 100, 'veh_test', '2024-01-01'), // baseline
        makeFuelExpense(7.61, undefined, 100, 'veh_test', '2024-02-01'),
        makeFuelExpense(7.07, undefined, 100, 'veh_test', '2024-03-01'),
        makeFuelExpense(9.25, undefined, 100, 'veh_test', '2024-04-01'),
        makeFuelExpense(9.41, 781, 100, 'veh_test', '2024-05-01'),
      ]
      const result = calcFuelConsumption(vehicle, expenses)
      // relevant: 7.61+7.07+9.25+9.41 = 33.34L, latest at 781km
      // burned = 17+33.34-17 = 33.34 / (781-1) * 100 = 33.34/780*100 = 4.274... → 4.27
      expect(result).toBe(4.27)
    })
  })

  describe('when fills have no distance and odometer is recorded only on some entries', () => {
    it('should count liters from all fills after baseline even when they have no distance', () => {
      // Real-world pattern: fill up each time but only record odometer occasionally
      // baseline: 14.8L at 0km, full
      // fills without distance: 7.61 + 7.07 + 9.25 = 23.93L — still count toward totalFuelAdded
      // final fill with odometer: 9.41L at 782km, full
      // burned = 17 + (7.61+7.07+9.25+9.41) - 17 = 33.34L / 782km → 4.26 L/100km
      const vehicle = makeVehicle({ fuelTankSize: 17 })
      const expenses = [
        makeFuelExpense(14.8, 0, 100, 'veh_test', '2026-01-01'), // baseline
        makeFuelExpense(7.61, undefined, 100, 'veh_test', '2026-01-10'),
        makeFuelExpense(7.07, undefined, 100, 'veh_test', '2026-01-20'),
        makeFuelExpense(9.25, undefined, 100, 'veh_test', '2026-02-01'),
        makeFuelExpense(9.41, 782, 100, 'veh_test', '2026-02-10'),
      ]
      const result = calcFuelConsumption(vehicle, expenses)
      // 33.34 / 782 * 100 = 4.263... → 4.26
      expect(result).toBe(4.26)
    })

    it('should still work when distance is recorded mid-sequence but a later fill has a higher odometer', () => {
      // odometer recorded on fill 3 (300km) and fill 5 (782km) — fill 5 is the latest reference
      // fills 1 (baseline), 2, 4 have no odometer but their liters still count
      const vehicle = makeVehicle({ fuelTankSize: 17 })
      const expenses = [
        makeFuelExpense(14.8, 0, 100, 'veh_test', '2026-01-01'), // baseline at 0km
        makeFuelExpense(7.61, undefined, 100, 'veh_test', '2026-01-10'),
        makeFuelExpense(7.07, 300, 100, 'veh_test', '2026-01-20'), // mid-sequence odometer
        makeFuelExpense(9.25, undefined, 100, 'veh_test', '2026-02-01'),
        makeFuelExpense(9.41, 782, 100, 'veh_test', '2026-02-10'), // highest odometer → latest
      ]
      const result = calcFuelConsumption(vehicle, expenses)
      // relevant total: 7.61+7.07+9.25+9.41 = 33.34L, latest at 782km
      // burned = 17+33.34-17 = 33.34 / 782 * 100 = 4.26 L/100km
      expect(result).toBe(4.26)
    })

    it('should return null when no fill after the baseline has an odometer reading', () => {
      const vehicle = makeVehicle({ fuelTankSize: 17 })
      const expenses = [
        makeFuelExpense(14.8, 0, 100, 'veh_test', '2026-01-01'), // baseline
        makeFuelExpense(7.61, undefined, 100, 'veh_test', '2026-01-10'), // no odometer
        makeFuelExpense(9.41, undefined, 100, 'veh_test', '2026-02-01'), // no odometer
      ]
      expect(calcFuelConsumption(vehicle, expenses)).toBeNull()
    })
  })

  describe('when distance between baseline and latest equals zero', () => {
    it('should return null', () => {
      const vehicle = makeVehicle({ fuelTankSize: 17, odometerAtRegistration: 0 })
      const expenses = [makeFuelExpense(15, 100, 100, 'veh_test', '2024-01-01'), makeFuelExpense(10, 100, 100, 'veh_test', '2024-02-01')]
      expect(calcFuelConsumption(vehicle, expenses)).toBeNull()
    })
  })

  describe('when expenses belong to a different vehicle', () => {
    it('should ignore them', () => {
      const vehicle = makeVehicle({ id: 'veh_a' })
      expect(calcFuelConsumption(vehicle, [makeFuelExpense(40, 500, 100, 'veh_b')])).toBeNull()
    })
  })

  describe('when the result has more than two decimal places', () => {
    it('should round to 2 decimal places', () => {
      // baseline: 5L at 0km, full — subsequent: 10L at 300km, full
      // burned = 17+10-17 = 10 / 300 * 100 = 3.333... → 3.33
      const vehicle = makeVehicle({ fuelTankSize: 17 })
      const expenses = [makeFuelExpense(5, 0, 100, 'veh_test', '2024-01-01'), makeFuelExpense(10, 300, 100, 'veh_test', '2024-02-01')]
      expect(calcFuelConsumption(vehicle, expenses)).toBe(3.33)
    })
  })
})

describe('daysUntilExpiry', () => {
  describe('when the date is in the future', () => {
    it('should return a positive number', () => {
      const future = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10)
      expect(daysUntilExpiry(future)).toBeGreaterThan(0)
    })
  })

  describe('when the date is in the past', () => {
    it('should return a negative number', () => {
      const past = new Date(Date.now() - 10 * 86_400_000).toISOString().slice(0, 10)
      expect(daysUntilExpiry(past)).toBeLessThan(0)
    })
  })
})
