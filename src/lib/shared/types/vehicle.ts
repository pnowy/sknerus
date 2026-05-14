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
  Insurance: 'insurance',
  OilChange: 'oilChange',
  Purchase: 'purchase',
  Accessories: 'accessories',
} as const
export type VehicleExpenseType = (typeof VehicleExpenseType)[keyof typeof VehicleExpenseType]

export const VEHICLE_EXPENSE_TYPE_LABELS: Record<VehicleExpenseType, string> = {
  [VehicleExpenseType.Fuel]: 'Fuel',
  [VehicleExpenseType.Insurance]: 'Insurance',
  [VehicleExpenseType.OilChange]: 'Oil change',
  [VehicleExpenseType.Purchase]: 'Purchase',
  [VehicleExpenseType.Accessories]: 'Accessories',
}

export type VehicleExpenseTypeNames = Partial<Record<VehicleExpenseType, string>>
export type VehicleExpenseTypeIcons = Partial<Record<VehicleExpenseType, string>>
export type VehicleExpenseTypeColors = Partial<Record<VehicleExpenseType, string>>

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
  oilChangeIntervalKm?: number
  oilChangeIntervalMonths?: number
  expenseTypeNames?: VehicleExpenseTypeNames
  expenseTypeIcons?: VehicleExpenseTypeIcons
  expenseTypeColors?: VehicleExpenseTypeColors
}

export type VehicleExpense = {
  vehicleId: string
  expenseType: VehicleExpenseType
  fuelLiters?: number
  odometerReading?: number
  fuelLevelPercent?: number
}
