export type Expense = {
  id: string
  name: string
  /** Signed: positive = income, negative = expense */
  amount: number
  currency: string
  categoryId: string
  date: string
  tags: Array<string>
  recurringId?: string
}

export type RecurringExpense = {
  id: string
  name: string
  /** Signed: positive = income, negative = expense */
  amount: number
  currency: string
  categoryId: string
  tags: Array<string>
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
}

export type Config = {
  categories: Array<Category>
  currency: string
  startDate: number
}
