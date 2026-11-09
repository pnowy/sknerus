import type { Category, Expense } from '@/lib/shared/types/expense'

export type CashflowSide = 'source' | 'hub' | 'sink'

export type CashflowNode = {
  name: string
  color: string
  value: number
  side: CashflowSide
}

export type CashflowLink = { source: number; target: number; value: number }

export type CashflowData = { nodes: Array<CashflowNode>; links: Array<CashflowLink> }

const HUB_NAME = 'Cash Flow'
const HUB_COLOR = '#10a860'
const UNCATEGORIZED_COLOR = '#6b7280'

/**
 * Builds Sankey data: income sources -> Cash Flow hub -> expense categories (+ Surplus).
 * When expenses exceed income, a "Deficit" source balances the hub so flows stay conserved.
 */
export function buildCashflowData(expenses: Array<Expense>, categories: Array<Category>): CashflowData {
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const incomeByCat = new Map<string, number>()
  const expenseByCat = new Map<string, number>()

  for (const e of expenses) {
    if (e.amount === 0) continue
    const target = e.amount > 0 ? incomeByCat : expenseByCat
    target.set(e.categoryId, (target.get(e.categoryId) ?? 0) + Math.abs(e.amount))
  }

  const toEntries = (map: Map<string, number>) =>
    Array.from(map.entries())
      .map(([id, value]) => {
        const cat = catMap.get(id)
        return { name: cat?.name ?? 'Uncategorized', color: cat?.color ?? UNCATEGORIZED_COLOR, value }
      })
      .sort((a, b) => b.value - a.value)

  const incomes = toEntries(incomeByCat)
  const outgoings = toEntries(expenseByCat)
  const totalIncome = incomes.reduce((s, i) => s + i.value, 0)
  const totalExpenses = outgoings.reduce((s, i) => s + i.value, 0)
  if (totalIncome === 0 && totalExpenses === 0) return { nodes: [], links: [] }

  const sources = [...incomes]
  if (totalExpenses > totalIncome) sources.push({ name: 'Deficit', color: '#ef4444', value: totalExpenses - totalIncome })
  const sinks = [...outgoings]
  if (totalIncome > totalExpenses) sinks.push({ name: 'Surplus', color: HUB_COLOR, value: totalIncome - totalExpenses })

  const hubValue = Math.max(totalIncome, totalExpenses)
  const nodes: Array<CashflowNode> = [
    ...sources.map((s) => ({ ...s, side: 'source' as const })),
    { name: HUB_NAME, color: HUB_COLOR, value: hubValue, side: 'hub' },
    ...sinks.map((s) => ({ ...s, side: 'sink' as const })),
  ]
  const hubIndex = sources.length
  const links: Array<CashflowLink> = [
    ...sources.map((s, i) => ({ source: i, target: hubIndex, value: s.value })),
    ...sinks.map((s, i) => ({ source: hubIndex, target: hubIndex + 1 + i, value: s.value })),
  ]
  return { nodes, links }
}
