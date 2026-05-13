export const VehicleType = {
  Car: 'car',
  Motorcycle: 'motorcycle',
} as const
export type VehicleType = (typeof VehicleType)[keyof typeof VehicleType]

export const FuelType = {
  Gasoline: 'gasoline',
  Diesel: 'diesel',
  Lpg: 'lpg',
} as const
export type FuelType = (typeof FuelType)[keyof typeof FuelType]

export const VehicleExpenseType = {
  Fuel: 'fuel',
} as const
export type VehicleExpenseType = (typeof VehicleExpenseType)[keyof typeof VehicleExpenseType]

export type VehicleExpenseTypeNames = Record<VehicleExpenseType, string>

export type Vehicle = {
  id: string
  name: string
  type: VehicleType
  odometerAtRegistration: number
  yearOfProduction: number
  engineSize: number
  fuelTankSize: number
  fuelType: FuelType
  insuranceExpiry?: string
  technicalInspectionExpiry?: string
  expenseTypeNames?: VehicleExpenseTypeNames
}

export type VehicleExpense = {
  vehicleId: string
  expenseType: VehicleExpenseType
  fuelLiters: number
  vehicleDistance?: number
  fuelLevelPercent: number
}
