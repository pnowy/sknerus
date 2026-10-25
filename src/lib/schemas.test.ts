import { describe, expect, it } from 'vitest'
import { categorySchema, configSchema } from '@/lib/schemas'

describe('categorySchema', () => {
  it('should validate category with isIncome set to true', () => {
    const category = {
      id: 'cat_123',
      name: 'Salary',
      color: '#22c55e',
      isIncome: true,
    }
    const result = categorySchema.safeParse(category)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isIncome).toBe(true)
    }
  })

  it('should validate category without isIncome', () => {
    const category = {
      id: 'cat_456',
      name: 'Groceries',
      color: '#84cc16',
    }
    const result = categorySchema.safeParse(category)
    expect(result.success).toBe(true)
  })

  it('should validate full config with mixed categories', () => {
    const config = {
      categories: [
        { id: 'cat_1', name: 'Salary', color: '#22c55e', isIncome: true },
        { id: 'cat_2', name: 'Groceries', color: '#84cc16', isIncome: false },
        { id: 'cat_3', name: 'Housing', color: '#3b82f6' },
      ],
      currency: 'USD',
      startDate: 1,
      supportedCurrencies: ['EUR'],
      startPage: 'dashboard',
      exchangeProvider: 'frankfurter',
      showTags: true,
      showNotes: true,
      fabPosition: 'right',
      features: { vehicleExpenseTracking: false },
    }
    const result = configSchema.safeParse(config)
    expect(result.success).toBe(true)
  })

  describe('when showSearch is omitted', () => {
    it('should default search to disabled', () => {
      const result = configSchema.parse({ categories: [], currency: 'USD', startDate: 1 })
      expect(result.showSearch).toBe(false)
    })
  })
})
