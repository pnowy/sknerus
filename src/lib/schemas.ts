import { z } from 'zod'
import { FabPosition } from '@/lib/shared/types/fab-position'
import { RecurringLinkMode } from '@/lib/shared/types/subscription'
import { FuelType, VehicleExpenseType, VehicleType } from '@/lib/shared/types/vehicle'
import { VEHICLE_EXPENSE_ICONS } from '@/lib/shared/vehicle-icons'

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
const iconName = z.enum(Object.keys(VEHICLE_EXPENSE_ICONS) as [string, ...Array<string>])
const hexColor = z.string().regex(HEX_COLOR, 'Must be a #RRGGBB hex color')

const toZodEnum = <T extends string>(obj: Record<string, T>) => z.enum(Object.values(obj) as [T, ...Array<T>])

const vehicleExpenseSchema = z
  .object({
    vehicleId: z.string().min(1),
    expenseType: toZodEnum(VehicleExpenseType),
    fuelLiters: z.number().positive('Fuel liters must be positive').optional(),
    odometerReading: z.number().int().min(0).optional(),
    fuelLevelPercent: z
      .number()
      .int()
      .min(0)
      .max(100)
      .refine((v) => v % 5 === 0, 'Must be a multiple of 5')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.expenseType === VehicleExpenseType.Fuel) {
      if (data.fuelLiters == null) {
        ctx.addIssue({ code: 'custom', path: ['fuelLiters'], message: 'Fuel liters is required' })
      }
      if (data.fuelLevelPercent == null) {
        ctx.addIssue({ code: 'custom', path: ['fuelLevelPercent'], message: 'Fuel level is required' })
      }
    }
    if (data.expenseType === VehicleExpenseType.OilChange && data.odometerReading == null) {
      ctx.addIssue({ code: 'custom', path: ['odometerReading'], message: 'Odometer reading is required' })
    }
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
  isIncome: z.boolean().optional(),
})

const featuresSchema = z
  .object({
    vehicleExpenseTracking: z.boolean().default(false),
    subscriptionTracking: z.boolean().default(false),
  })
  .default({ vehicleExpenseTracking: false, subscriptionTracking: false })

const percent = z.number().min(0, 'Must be 0 or more').max(100, 'Must be 100 or less')

export const deductionProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  vatRate: percent,
  vatRecoverable: percent,
  incomeTaxRate: percent,
  extraRate: percent,
})

export const deductionProfileFormSchema = deductionProfileSchema.omit({ id: true })

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
  showSearch: z.boolean().default(false),
  fabPosition: toZodEnum(FabPosition).default(FabPosition.Right),
  features: featuresSchema,
  deductionProfiles: z.array(deductionProfileSchema).default([]),
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
  interval: z.number().int().min(1).max(120).optional(),
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
  oilChangeIntervalKm: z.number().int().positive().optional(),
  oilChangeIntervalMonths: z.number().int().positive().optional(),
  expenseTypeNames: z
    .object(
      Object.fromEntries(Object.values(VehicleExpenseType).map((v) => [v, z.string().optional()])) as Record<
        VehicleExpenseType,
        z.ZodOptional<z.ZodString>
      >
    )
    .optional(),
  expenseTypeIcons: z
    .object(
      Object.fromEntries(Object.values(VehicleExpenseType).map((v) => [v, iconName.optional()])) as Record<
        VehicleExpenseType,
        z.ZodOptional<typeof iconName>
      >
    )
    .optional(),
  expenseTypeColors: z
    .object(
      Object.fromEntries(Object.values(VehicleExpenseType).map((v) => [v, hexColor.optional()])) as Record<
        VehicleExpenseType,
        z.ZodOptional<typeof hexColor>
      >
    )
    .optional(),
})

export const vehicleFormSchema = vehicleSchema.omit({ id: true })

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')

export const subscriptionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(1),
  billingPeriodMonths: z.number().int().min(1, 'At least 1 month').max(120),
  deductionProfileId: z.string().min(1).optional(),
  priceIncludesVat: z.boolean().default(true),
  active: z.boolean().default(true),
  categoryId: z.string().min(1).optional(),
  nextRenewal: isoDate.optional(),
  url: z.url().optional(),
  notes: z.string().optional(),
  recurringId: z.string().min(1).optional(),
  paymentIds: z.array(z.string().min(1)).optional(),
})

// API payload: `schedule` asks the server to create a linked recurring transaction starting on that date
export const subscriptionPayloadSchema = subscriptionSchema.omit({ id: true }).extend({
  schedule: z.object({ startDate: isoDate }).optional(),
})

export const subscriptionFormSchema = subscriptionSchema
  .omit({ id: true, recurringId: true, deductionProfileId: true, categoryId: true, nextRenewal: true, url: true })
  .extend({
    isBusiness: z.boolean(),
    deductionProfileId: z.string(),
    categoryId: z.string(),
    nextRenewal: z.string(),
    url: z.union([z.literal(''), z.url('Invalid URL')]),
    linkMode: toZodEnum(RecurringLinkMode),
    scheduleStartDate: z.string(),
    existingRecurringId: z.string(),
    paymentIds: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (data.isBusiness && !data.deductionProfileId) {
      ctx.addIssue({ code: 'custom', path: ['deductionProfileId'], message: 'Pick a deduction profile' })
    }
    if (data.linkMode !== RecurringLinkMode.Manual && !data.categoryId) {
      ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'Category is required for transactions' })
    }
    if (data.linkMode === RecurringLinkMode.Create && !/^\d{4}-\d{2}-\d{2}$/.test(data.scheduleStartDate)) {
      ctx.addIssue({ code: 'custom', path: ['scheduleStartDate'], message: 'First payment date is required' })
    }
    if (data.linkMode === RecurringLinkMode.Existing && !data.existingRecurringId) {
      ctx.addIssue({ code: 'custom', path: ['existingRecurringId'], message: 'Pick a recurring transaction' })
    }
  })

export const bookPaymentSchema = z.object({
  date: isoDate,
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().min(1, 'Pick a category'),
  /** Also store the paid amount as the subscription price, e.g. after a price change */
  updatePrice: z.boolean().default(false),
})

export const importRecurringSchema = z.object({
  recurringIds: z.array(z.string().min(1)).min(1),
  deductionProfileId: z.string().min(1).optional(),
})

// Full backup: every stored collection with ids and links intact, so a restore recreates the instance exactly
export const BACKUP_VERSION = 1

export const backupSchema = z.object({
  app: z.literal('sknerus'),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  data: z.object({
    config: configSchema,
    expenses: z.array(expenseSchema.extend({ id: z.string().min(1), recurringId: z.string().min(1).optional() })),
    recurring: z.array(recurringExpenseSchema),
    vehicles: z.array(vehicleSchema),
    subscriptions: z.array(subscriptionSchema),
  }),
})

export type ExpenseInput = z.infer<typeof expenseSchema>
export type ExpenseFormInput = z.infer<typeof expenseFormSchema>
export type ConfigInput = z.infer<typeof configSchema>
export type RecurringExpenseInput = z.infer<typeof recurringExpenseSchema>
export type RecurringFormInput = z.infer<typeof recurringFormSchema>
export type VehicleInput = z.infer<typeof vehicleSchema>
export type VehicleFormInput = z.infer<typeof vehicleFormSchema>
export type DeductionProfileFormInput = z.infer<typeof deductionProfileFormSchema>
export type SubscriptionPayload = z.infer<typeof subscriptionPayloadSchema>
export type SubscriptionFormInput = z.infer<typeof subscriptionFormSchema>
export type ImportRecurringInput = z.infer<typeof importRecurringSchema>
export type BookPaymentInput = z.infer<typeof bookPaymentSchema>
export type Backup = z.infer<typeof backupSchema>
/** Shape written to the backup file; parsing fills in config defaults */
export type BackupFile = z.input<typeof backupSchema>
