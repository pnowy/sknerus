import { describe, expect, it } from 'vitest'
import { customDateRangeSchema, searchParamsSchema } from '@/lib/shared/search-params'
import { DashboardTab } from '@/lib/shared/types/dashboard-tab'
import { RangeScope } from '@/lib/shared/types/range-scope'

describe('searchParamsSchema', () => {
  describe('when no range is provided', () => {
    it('should preserve the existing defaults', () => {
      expect(searchParamsSchema.parse({})).toEqual({ scope: RangeScope.Month, offset: 0, tab: DashboardTab.Breakdown })
    })
  })

  describe('when a custom range is provided', () => {
    it('should retain both dates and the active tab', () => {
      const search = {
        scope: RangeScope.Custom,
        from: '2024-02-29',
        to: '2024-03-10',
        offset: 0,
        tab: DashboardTab.Trends,
      }
      expect(searchParamsSchema.parse(search)).toEqual(search)
    })

    it.each([
      {},
      { from: '2024-02-01' },
      { to: '2024-02-01' },
      { from: '2024-02-10', to: '2024-02-01' },
      { from: '2023-02-29', to: '2023-03-01' },
      { from: '2024-02-01', to: '2024-02-30' },
      { from: '02/01/2024', to: '2024-03-01' },
    ])('should reject incomplete, reversed, or invalid dates: %j', (range) => {
      expect(searchParamsSchema.safeParse({ scope: RangeScope.Custom, ...range }).success).toBe(false)
    })
  })

  describe('when a preset is selected', () => {
    it.each(Object.values(RangeScope).filter((scope) => scope !== RangeScope.Custom))('should accept %s without dates', (scope) => {
      expect(searchParamsSchema.parse({ scope, offset: -1 }).scope).toBe(scope)
    })
  })
})

describe('customDateRangeSchema', () => {
  describe('when both dates are the same', () => {
    it('should accept a single-day range', () => {
      expect(customDateRangeSchema.safeParse({ from: '2024-02-29', to: '2024-02-29' }).success).toBe(true)
    })
  })

  describe('when the end precedes the start', () => {
    it('should report the error on the end date', () => {
      const result = customDateRangeSchema.safeParse({ from: '2024-03-02', to: '2024-03-01' })
      expect(result.error?.issues).toEqual([expect.objectContaining({ path: ['to'], message: 'End date must be on or after start date' })])
    })
  })
})
