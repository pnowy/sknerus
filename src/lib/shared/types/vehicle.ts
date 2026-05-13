export enum VehicleType {
  Car = 'car',
  Motorcycle = 'motorcycle',
}

export enum FuelType {
  Gasoline = 'gasoline',
  Diesel = 'diesel',
  Lpg = 'lpg',
}

export enum VehicleExpenseType {
  Fuel = 'fuel',
}

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
