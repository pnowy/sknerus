import { z } from 'zod'
import { DashboardTab } from '@/lib/shared/types/dashboard-tab'
import { RangeScope } from '@/lib/shared/types/range-scope'

export const customDateRangeSchema = z
  .object({
    from: z.iso.date({ error: 'Enter a valid start date' }),
    to: z.iso.date({ error: 'Enter a valid end date' }),
  })
  .refine((range) => range.from <= range.to, {
    path: ['to'],
    message: 'End date must be on or after start date',
  })

export type CustomDateRange = z.infer<typeof customDateRangeSchema>

export const searchParamsSchema = z
  .object({
    scope: z.enum(RangeScope).default(RangeScope.Month),
    offset: z.number().int().default(0),
    tab: z.enum(DashboardTab).default(DashboardTab.Breakdown),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
  })
  .superRefine((search, ctx) => {
    if (search.scope === RangeScope.Custom) {
      const result = customDateRangeSchema.safeParse(search)
      if (!result.success) {
        for (const issue of result.error.issues) ctx.addIssue({ code: 'custom', path: issue.path, message: issue.message })
      }
    }
  })
