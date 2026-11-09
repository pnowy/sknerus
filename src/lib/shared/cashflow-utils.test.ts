import { describe, expect, it } from 'vitest'
import { buildCashflowData } from '@/lib/shared/cashflow-utils'
import type { Category, Expense } from '@/lib/shared/types/expense'

const categories = [
  { id: 'cat_salary', name: 'Salary', color: '#111111' },
  { id: 'cat_food', name: 'Food', color: '#222222' },
] as Array<Category>

const tx = (categoryId: string, amount: number) => ({ id: `exp_${categoryId}${amount}`, categoryId, amount }) as Expense

describe('buildCashflowData', () => {
  describe('when there are no transactions', () => {
    it('should return empty data', () => {
      expect(buildCashflowData([], categories)).toEqual({ nodes: [], links: [] })
    })
  })

  describe('when income exceeds expenses', () => {
    const data = buildCashflowData([tx('cat_salary', 1000), tx('cat_food', -300), tx('cat_food', -100)], categories)

    it('should aggregate expenses per category', () => {
      expect(data.nodes.find((n) => n.name === 'Food')?.value).toBe(400)
    })

    it('should add a Surplus sink with the remainder', () => {
      expect(data.nodes.find((n) => n.name === 'Surplus')?.value).toBe(600)
    })

    it('should conserve flow through the hub', () => {
      const hub = data.nodes.findIndex((n) => n.side === 'hub')
      const inflow = data.links.filter((l) => l.target === hub).reduce((s, l) => s + l.value, 0)
      const outflow = data.links.filter((l) => l.source === hub).reduce((s, l) => s + l.value, 0)
      expect(inflow).toBe(1000)
      expect(outflow).toBe(1000)
    })
  })

  describe('when expenses exceed income', () => {
    it('should add a Deficit source instead of Surplus', () => {
      const data = buildCashflowData([tx('cat_salary', 100), tx('cat_food', -250)], categories)
      expect(data.nodes.find((n) => n.name === 'Deficit')?.value).toBe(150)
      expect(data.nodes.some((n) => n.name === 'Surplus')).toBe(false)
    })
  })

  describe('when a category is unknown', () => {
    it('should label it Uncategorized', () => {
      const data = buildCashflowData([tx('cat_gone', -50)], categories)
      expect(data.nodes.some((n) => n.name === 'Uncategorized')).toBe(true)
    })
  })
})
