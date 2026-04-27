import type { Config, Expense } from '@/lib/shared/types/expense'

export interface StorageAdapter {
  getExpenses(): Promise<Array<Expense>>
  saveExpenses(expenses: Array<Expense>): Promise<void>
  getConfig(): Promise<Config>
  saveConfig(config: Config): Promise<void>
}
