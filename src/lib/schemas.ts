import { z } from 'zod'
import { FuelType, VehicleExpenseType, VehicleType } from '@/lib/shared/types/vehicle'

const toZodEnum = <T extends string>(obj: Record<string, T>) => z.enum(Object.values(obj) as [T, ...Array<T>])

const vehicleExpenseSchema = z.object({
  vehicleId: z.string().min(1),
  expenseType: toZodEnum(VehicleExpenseType),
  fuelLiters: z.number().positive('Fuel liters must be positive'),
  vehicleDistance: z.number().int().min(0).optional(),
  fuelLevelPercent: z
    .number()
    .int()
    .min(0)
    .max(100)
    .refine((v) => v % 10 === 0, 'Must be a multiple of 10'),
})

export const expenseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().refine((n) => n !== 0, 'Amount cannot be zero'),
  currency: z.string().min(1),
  categoryId: z.string().min(1, 'Category is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  tags: z.array(z.string()),
  notes: z.string().optional(),
  originalAmount: z.number().optional(),
  originalCurrency: z.string().optional(),
  vehicleExpense: vehicleExpenseSchema.optional(),
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
  vehicleId: z.string().optional(),
})

const featuresSchema = z
  .object({
    vehicleExpenseTracking: z.boolean().default(false),
  })
  .default({ vehicleExpenseTracking: false })

export const configSchema = z.object({
  categories: z.array(categorySchema),
  currency: z.string().min(1),
  startDate: z.number().int().min(1).max(31),
  supportedCurrencies: z.array(z.string()).default([]),
  startPage: z.string().default('dashboard'),
  exchangeProvider: z.string().default('frankfurter'),
  exchangeApiKey: z.string().optional(),
  showTags: z.boolean().default(true),
  showNotes: z.boolean().default(true),
  features: featuresSchema,
})

export const recurringExpenseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  amount: z.number().refine((n) => n !== 0, 'Amount cannot be zero'),
  currency: z.string().min(1),
  categoryId: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()),
  notes: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  month: z.number().int().min(1).max(12).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')
    .optional(),
})

export const recurringFormSchema = recurringExpenseSchema.omit({ id: true }).extend({
  amount: z.number().positive('Amount must be positive'),
  isIncome: z.boolean(),
  endDate: z.string().optional(),
})

export const vehicleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  type: toZodEnum(VehicleType),
  odometerAtRegistration: z.number().int().min(0),
  yearOfProduction: z.number().int().min(1886).max(new Date().getFullYear()),
  engineSize: z.number().int().positive(),
  fuelTankSize: z.number().positive(),
  fuelType: toZodEnum(FuelType),
  insuranceExpiry: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')
    .optional(),
  technicalInspectionExpiry: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')
    .optional(),
  expenseTypeNames: z.record(toZodEnum(VehicleExpenseType), z.string()).optional(),
})

export const vehicleFormSchema = vehicleSchema.omit({ id: true })

export type ExpenseInput = z.infer<typeof expenseSchema>
export type ExpenseFormInput = z.infer<typeof expenseFormSchema>
export type ConfigInput = z.infer<typeof configSchema>
export type RecurringExpenseInput = z.infer<typeof recurringExpenseSchema>
export type RecurringFormInput = z.infer<typeof recurringFormSchema>
export type VehicleInput = z.infer<typeof vehicleSchema>
export type VehicleFormInput = z.infer<typeof vehicleFormSchema>
