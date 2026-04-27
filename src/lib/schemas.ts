import { z } from 'zod'

export const expenseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().refine((n) => n !== 0, 'Amount cannot be zero'),
  currency: z.string().min(1),
  categoryId: z.string().min(1, 'Category is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  tags: z.array(z.string()),
})

// Form schema keeps amount positive + isIncome toggle for UX convenience
export const expenseFormSchema = expenseSchema.extend({
  amount: z.number().positive('Amount must be positive'),
  isIncome: z.boolean(),
})

export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string(),
})

export const configSchema = z.object({
  categories: z.array(categorySchema),
  currency: z.string().min(1),
  startDate: z.number().int().min(1).max(31),
})

export type ExpenseInput = z.infer<typeof expenseSchema>
export type ExpenseFormInput = z.infer<typeof expenseFormSchema>
export type ConfigInput = z.infer<typeof configSchema>
