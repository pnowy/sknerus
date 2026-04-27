import type { Config, Expense, RecurringExpense } from '@/lib/shared/types/expense'

export interface StorageAdapter {
  getExpenses(): Promise<Array<Expense>>
  saveExpenses(expenses: Array<Expense>): Promise<void>
  getConfig(): Promise<Config>
  saveConfig(config: Config): Promise<void>
  getRecurring(): Promise<Array<RecurringExpense>>
  saveRecurring(recurring: Array<RecurringExpense>): Promise<void>
}
