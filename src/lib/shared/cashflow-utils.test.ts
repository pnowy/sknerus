import { describe, expect, it } from 'vitest'
import { buildCashflowData, countCashflowCategories, getSankeyNodePadding, getSankeyPlotHeight } from '@/lib/shared/cashflow-utils'
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

  describe('when there are more expense categories than the limit', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: `cat_${i}`, name: `Cat ${i}`, color: '#333333' })) as Array<Category>
    const txs = [tx('cat_salary', 10_000), ...many.map((c, i) => tx(c.id, -(i + 1) * 10))]
    const data = buildCashflowData(txs, [...categories, ...many], { maxCategories: 5 })
    const sinks = data.nodes.filter((n) => n.side === 'sink')

    it('should keep the largest categories and group the rest into Other', () => {
      expect(sinks.map((n) => n.name)).toEqual(['Cat 11', 'Cat 10', 'Cat 9', 'Cat 8', 'Other', 'Surplus'])
    })

    it('should record how many categories Other contains', () => {
      // 12 categories, 4 shown -> 8 grouped
      expect(sinks.find((n) => n.name === 'Other')?.groupedCount).toBe(8)
    })

    it('should sum the grouped categories into Other', () => {
      // Cat 0..7 -> 10 + 20 + ... + 80
      expect(sinks.find((n) => n.name === 'Other')?.value).toBe(360)
    })

    it('should still conserve flow through the hub', () => {
      const hub = data.nodes.findIndex((n) => n.side === 'hub')
      const outflow = data.links.filter((l) => l.source === hub).reduce((s, l) => s + l.value, 0)
      expect(outflow).toBe(10_000)
    })
  })

  describe('when the category count equals the limit', () => {
    it('should not add an Other node', () => {
      const data = buildCashflowData([tx('cat_salary', 100), tx('cat_food', -50)], categories, { maxCategories: 1 })
      expect(data.nodes.some((n) => n.name === 'Other')).toBe(false)
    })
  })
})

describe('buildCashflowData drill-down', () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ id: `cat_${i}`, name: `Cat ${i}`, color: '#333333' })) as Array<Category>
  const all = [...categories, ...many]
  // Cat 11 is the largest expense, Cat 0 the smallest.
  const txs = [tx('cat_salary', 10_000), ...many.map((c, i) => tx(c.id, -(i + 1) * 10))]

  describe('when the top level groups categories into Other', () => {
    it('should mark the Other node as drillable', () => {
      const data = buildCashflowData(txs, all, { maxCategories: 5 })
      expect(data.nodes.find((n) => n.name === 'Other')?.isOther).toBe(true)
    })
  })

  describe('when drilling into expense Other at depth 1', () => {
    const data = buildCashflowData(txs, all, { maxCategories: 5, drill: { side: 'sink', depth: 1 } })

    it('should start from an Other expenses node holding the grouped total', () => {
      expect(data.nodes[0]).toMatchObject({ name: 'Other expenses', side: 'hub', value: 360 })
    })

    it('should list the next categories and group the remainder again', () => {
      expect(data.nodes.filter((n) => n.side === 'sink').map((n) => n.name)).toEqual(['Cat 7', 'Cat 6', 'Cat 5', 'Cat 4', 'Other'])
    })

    it('should link the root to every category', () => {
      expect(data.links.every((l) => l.source === 0)).toBe(true)
      expect(data.links.reduce((s, l) => s + l.value, 0)).toBe(360)
    })
  })

  describe('when drilling into expense Other at depth 2', () => {
    it('should show the remaining smallest categories without another Other', () => {
      const data = buildCashflowData(txs, all, { maxCategories: 5, drill: { side: 'sink', depth: 2 } })
      expect(data.nodes.filter((n) => n.side === 'sink').map((n) => n.name)).toEqual(['Cat 3', 'Cat 2', 'Cat 1', 'Cat 0'])
    })
  })

  describe('when drilling into income Other', () => {
    const incomeCats = Array.from({ length: 7 }, (_, i) => ({ id: `inc_${i}`, name: `Inc ${i}`, color: '#444444' })) as Array<Category>
    const data = buildCashflowData(
      incomeCats.map((c, i) => tx(c.id, (i + 1) * 100)),
      incomeCats,
      { maxCategories: 5, drill: { side: 'source', depth: 1 } }
    )

    it('should flow the grouped sources into an Other income node', () => {
      expect(data.nodes.at(-1)).toMatchObject({ name: 'Other income', side: 'hub', value: 600 })
      expect(data.nodes.filter((n) => n.side === 'source').map((n) => n.name)).toEqual(['Inc 2', 'Inc 1', 'Inc 0'])
    })
  })

  describe('when the drill depth is beyond the available categories', () => {
    it('should return empty data', () => {
      expect(buildCashflowData(txs, all, { maxCategories: 5, drill: { side: 'sink', depth: 9 } })).toEqual({ nodes: [], links: [] })
    })
  })
})

describe('getSankeyNodePadding', () => {
  describe('when there are few nodes', () => {
    it('should use the preferred padding', () => {
      expect(getSankeyNodePadding(3, 400)).toBe(28)
    })
  })

  describe('when many nodes would not fit with the preferred padding', () => {
    it('should shrink padding so gaps take at most half of the height', () => {
      expect(getSankeyNodePadding(11, 400)).toBe(20)
    })
  })

  describe('when there is a single node', () => {
    it('should use the preferred padding', () => {
      expect(getSankeyNodePadding(1, 100)).toBe(28)
    })
  })
})

describe('getSankeyPlotHeight', () => {
  describe('when the nodes fit in the minimum height', () => {
    it('should keep the minimum height', () => {
      expect(getSankeyPlotHeight(5, 346)).toBe(346)
    })
  })

  describe('when there are more nodes than the minimum height fits', () => {
    it('should grow by a fixed row height per node', () => {
      expect(getSankeyPlotHeight(17, 346)).toBe(17 * 44)
    })
  })
})

describe('countCashflowCategories', () => {
  describe('when expenses mix income, spending and zero amounts', () => {
    it('should count distinct categories per side and skip zero amounts', () => {
      const txs = [tx('cat_a', 10), tx('cat_a', 5), tx('cat_b', -1), tx('cat_c', -2), tx('cat_d', 0)]
      expect(countCashflowCategories(txs)).toEqual({ income: 1, expense: 2 })
    })
  })
})
