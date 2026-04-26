import { z } from 'zod'

export const expenseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(1),
  category: z.string().min(1, 'Category is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  tags: z.array(z.string()),
  isIncome: z.boolean(),
})

export const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string(),
})

export const configSchema = z.object({
  categories: z.array(categorySchema),
  currency: z.string().min(1),
  startDate: z.number().int().min(1).max(31),
})

export type ExpenseInput = z.infer<typeof expenseSchema>
export type ConfigInput = z.infer<typeof configSchema>
