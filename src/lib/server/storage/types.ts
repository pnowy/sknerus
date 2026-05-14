import type { Config, ExchangeRate, Expense, RecurringExpense } from '@/lib/shared/types/expense'
import type { Vehicle } from '@/lib/shared/types/vehicle'

export interface StorageAdapter {
  getExpenses(): Promise<Array<Expense>>
  saveExpenses(expenses: Array<Expense>): Promise<void>
  getConfig(): Promise<Config>
  saveConfig(config: Config): Promise<void>
  getRecurring(): Promise<Array<RecurringExpense>>
  saveRecurring(recurring: Array<RecurringExpense>): Promise<void>
  getExchangeRates(): Promise<Array<ExchangeRate>>
  saveExchangeRates(rates: Array<ExchangeRate>): Promise<void>
  getVehicles(): Promise<Array<Vehicle>>
  saveVehicles(vehicles: Array<Vehicle>): Promise<void>
}
