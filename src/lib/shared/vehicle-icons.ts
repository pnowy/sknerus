import {
  Car,
  ClipboardCheck,
  Container,
  Droplet,
  Droplets,
  FileText,
  FlaskConical,
  Fuel,
  KeyRound,
  Package,
  Receipt,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Wrench,
  Zap,
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import type { Expense } from '@/lib/shared/types/expense'
import type { Vehicle } from '@/lib/shared/types/vehicle'
import { VehicleExpenseType } from '@/lib/shared/types/vehicle'

export type VehicleExpenseIcon = ComponentType<SVGProps<SVGSVGElement>>

export const VEHICLE_EXPENSE_ICONS: Record<string, VehicleExpenseIcon> = {
  fuel: Fuel,
  droplet: Droplet,
  droplets: Droplets,
  flask: FlaskConical,
  container: Container,
  zap: Zap,
  shield: Shield,
  shieldCheck: ShieldCheck,
  fileText: FileText,
  wrench: Wrench,
  clipboardCheck: ClipboardCheck,
  shoppingCart: ShoppingCart,
  car: Car,
  keyRound: KeyRound,
  receipt: Receipt,
  package: Package,
  settings: Settings,
}

export const DEFAULT_EXPENSE_TYPE_ICON: Record<string, string> = {
  [VehicleExpenseType.Fuel]: 'fuel',
  [VehicleExpenseType.Insurance]: 'shield',
  [VehicleExpenseType.OilChange]: 'wrench',
  [VehicleExpenseType.Purchase]: 'keyRound',
  [VehicleExpenseType.Accessories]: 'package',
}

export const DEFAULT_EXPENSE_TYPE_COLOR: Record<VehicleExpenseType, string> = {
  [VehicleExpenseType.Fuel]: '#6366f1',
  [VehicleExpenseType.Insurance]: '#10b981',
  [VehicleExpenseType.OilChange]: '#f59e0b',
  [VehicleExpenseType.Purchase]: '#8b5cf6',
  [VehicleExpenseType.Accessories]: '#06b6d4',
}

/** `name` is a VEHICLE_EXPENSE_ICONS key or a lucide icon name; render it with NamedIcon */
export type ResolvedVehicleIcon = { name: string; color: string }

export function resolveVehicleExpenseIcon(expense: Expense, vehicles: Array<Vehicle> | undefined): ResolvedVehicleIcon | null {
  const ve = expense.vehicleExpense
  if (!ve) return null
  const vehicle = vehicles?.find((v) => v.id === ve.vehicleId)
  if (!vehicle) return null
  // '' means the user turned the icon off, so only a missing entry falls back to the default
  const name = vehicle.expenseTypeIcons?.[ve.expenseType] ?? DEFAULT_EXPENSE_TYPE_ICON[ve.expenseType]
  if (!name) return null
  const color = vehicle.expenseTypeColors?.[ve.expenseType] ?? DEFAULT_EXPENSE_TYPE_COLOR[ve.expenseType]
  return { name, color }
}
