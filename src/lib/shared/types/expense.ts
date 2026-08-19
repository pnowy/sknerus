import type { FabPosition } from '@/lib/shared/types/fab-position'
import type { VehicleExpense } from '@/lib/shared/types/vehicle.ts'

export type Expense = {
  id: string
  name: string
  /** Signed: positive = income, negative = expense */
  amount: number
  currency: string
  categoryId: string
  date: string
  tags: Array<string>
  notes?: string
  recurringId?: string
  originalAmount?: number
  originalCurrency?: string
  vehicleExpense?: VehicleExpense
}

export type RecurringExpense = {
  id: string
  name: string
  /** Signed: positive = income, negative = expense */
  amount: number
  currency: string
  categoryId: string
  tags: Array<string>
  notes?: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  dayOfMonth?: number
  dayOfWeek?: number
  month?: number
  startDate: string
  endDate?: string
}

export type Category = {
  id: string
  name: string
  color: string
  vehicleId?: string
}

export type AppFeatures = {
  vehicleExpenseTracking?: boolean
}

export type Config = {
  categories: Array<Category>
  currency: string
  startDate: number
  supportedCurrencies: Array<string>
  startPage: string
  exchangeProvider: string
  exchangeApiKey?: string
  showTags: boolean
  showNotes: boolean
  fabPosition: FabPosition
  features?: AppFeatures
}

type CurrencyCode = string
type Rate = number
// Record<fromCurrency, Record<toCurrency, rate>>,
// e.g. {
//  USD: { PLN: 3.64 },
//  EUR: { PLN: 4.26 }
// }
export type ExchangeRateMap = Record<CurrencyCode, Record<CurrencyCode, Rate>>

export type ExchangeRate = {
  date: string
  rates: ExchangeRateMap
}
