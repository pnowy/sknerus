export type Expense = {
  id: string
  name: string
  /** Signed: positive = income, negative = expense */
  amount: number
  currency: string
  category: string
  date: string
  tags: Array<string>
}

export type Category = {
  name: string
  color: string
}

export type Config = {
  categories: Array<Category>
  currency: string
  startDate: number
}
