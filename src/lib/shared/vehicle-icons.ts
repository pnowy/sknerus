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

export const VEHICLE_EXPENSE_ICON_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'fuel', label: 'Fuel pump' },
  { value: 'droplet', label: 'Droplet' },
  { value: 'droplets', label: 'Droplets' },
  { value: 'flask', label: 'Flask' },
  { value: 'container', label: 'Container' },
  { value: 'zap', label: 'Zap' },
  { value: 'shield', label: 'Shield' },
  { value: 'shieldCheck', label: 'Shield check' },
  { value: 'fileText', label: 'File' },
  { value: 'wrench', label: 'Wrench' },
  { value: 'clipboardCheck', label: 'Clipboard check' },
  { value: 'shoppingCart', label: 'Shopping cart' },
  { value: 'car', label: 'Car' },
  { value: 'keyRound', label: 'Key' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'package', label: 'Package' },
  { value: 'settings', label: 'Settings' },
]

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

export function getExpenseTypeIcon(name: string | undefined): VehicleExpenseIcon | null {
  if (!name) return null
  return VEHICLE_EXPENSE_ICONS[name] ?? null
}
