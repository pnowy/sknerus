import { describe, expect, it } from 'vitest'
import type { Expense } from '@/lib/shared/types/expense'
import { FuelType, type Vehicle, VehicleExpenseType, VehicleType } from '@/lib/shared/types/vehicle'
import { DEFAULT_EXPENSE_TYPE_COLOR, resolveVehicleExpenseIcon } from '@/lib/shared/vehicle-icons'

const baseVehicle: Vehicle = {
  id: 'veh_1',
  name: 'Bike',
  type: VehicleType.Motorcycle,
  odometerAtRegistration: 0,
  yearOfProduction: 2020,
  engineSize: 650,
  fuelTankSize: 15,
  fuelType: FuelType.Gasoline,
}

const fuelExpense: Expense = {
  id: 'exp_1',
  name: 'Fuel',
  amount: -100,
  currency: 'PLN',
  categoryId: 'cat_1',
  date: '2026-01-01',
  tags: [],
  vehicleExpense: { vehicleId: 'veh_1', expenseType: VehicleExpenseType.Fuel },
}

describe('resolveVehicleExpenseIcon', () => {
  describe('when the vehicle has no icon set for the type', () => {
    it('should fall back to the default icon and color', () => {
      expect(resolveVehicleExpenseIcon(fuelExpense, [baseVehicle])).toEqual({
        name: 'fuel',
        color: DEFAULT_EXPENSE_TYPE_COLOR[VehicleExpenseType.Fuel],
      })
    })
  })

  describe('when the icon was turned off for the type', () => {
    it('should show no icon', () => {
      const vehicle = { ...baseVehicle, expenseTypeIcons: { [VehicleExpenseType.Fuel]: '' } }
      expect(resolveVehicleExpenseIcon(fuelExpense, [vehicle])).toBeNull()
    })
  })

  describe('when a lucide icon outside the curated set is chosen', () => {
    it('should pass its name through', () => {
      const vehicle = { ...baseVehicle, expenseTypeIcons: { [VehicleExpenseType.Fuel]: 'bike' } }
      expect(resolveVehicleExpenseIcon(fuelExpense, [vehicle])?.name).toBe('bike')
    })
  })
})
