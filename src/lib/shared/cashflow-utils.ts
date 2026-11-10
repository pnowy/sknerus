import type { Category, Expense } from '@/lib/shared/types/expense'

export type CashflowSide = 'source' | 'hub' | 'sink'

export type CashflowNode = {
  name: string
  color: string
  value: number
  side: CashflowSide
  /** Grouped "Other" node that can be drilled into. */
  isOther?: boolean
  /** Number of categories inside an "Other" node. */
  groupedCount?: number
}

export type CashflowLink = { source: number; target: number; value: number }

export type CashflowData = { nodes: Array<CashflowNode>; links: Array<CashflowLink> }

/** Drill-down position: `depth` levels into the "Other" node of the given side. */
export type CashflowDrill = { side: 'source' | 'sink'; depth: number }

const HUB_NAME = 'Cash Flow'
const HUB_COLOR = '#10a860'
const UNCATEGORIZED_COLOR = '#6b7280'
const OTHER_COLOR = '#9ca3af'
const DEFAULT_MAX_CATEGORIES = 8
const PREFERRED_NODE_PADDING = 28
const MAX_PADDING_SHARE = 0.5
/** Vertical space per node that keeps a two-line label (name + amount) readable. */
const ROW_HEIGHT = 44

type Entry = Omit<CashflowNode, 'side'>

const EMPTY: CashflowData = { nodes: [], links: [] }
const sum = (entries: Array<Entry>) => entries.reduce((s, e) => s + e.value, 0)

/** Keeps the `max` largest entries (input sorted desc) and sums the rest into a single "Other" entry. */
function groupTail(entries: Array<Entry>, max: number): Array<Entry> {
  if (entries.length <= max) return entries
  const head = entries.slice(0, max - 1)
  const rest = entries.slice(max - 1)
  return [...head, { name: 'Other', color: OTHER_COLOR, value: sum(rest), isOther: true, groupedCount: rest.length }]
}

/** Plot height that fits `maxNodesInColumn` readable rows, never smaller than `minPlotHeight`. */
export function getSankeyPlotHeight(maxNodesInColumn: number, minPlotHeight: number): number {
  return Math.max(minPlotHeight, maxNodesInColumn * ROW_HEIGHT)
}

/** Number of distinct income and expense categories, used to decide whether a category limit applies. */
export function countCashflowCategories(expenses: Array<Expense>): { income: number; expense: number } {
  const income = new Set<string>()
  const expense = new Set<string>()
  for (const e of expenses) {
    if (e.amount > 0) income.add(e.categoryId)
    else if (e.amount < 0) expense.add(e.categoryId)
  }
  return { income: income.size, expense: expense.size }
}

/**
 * Node gap that never eats more than half of the chart height. Recharts' Sankey sizes nodes from
 * the height left after padding; if padding exceeds the height, every node and link collapses.
 */
export function getSankeyNodePadding(maxNodesInColumn: number, height: number): number {
  if (maxNodesInColumn <= 1) return PREFERRED_NODE_PADDING
  return Math.min(PREFERRED_NODE_PADDING, Math.floor((height * MAX_PADDING_SHARE) / (maxNodesInColumn - 1)))
}

/**
 * Builds Sankey data: income sources -> Cash Flow hub -> expense categories (+ Surplus).
 * Each side keeps the largest `maxCategories` categories; the rest are grouped into "Other".
 * When expenses exceed income, a "Deficit" source balances the hub so flows stay conserved.
 * With `drill`, returns the contents of that side's "Other" node instead (see `buildDrillData`).
 */
export function buildCashflowData(
  expenses: Array<Expense>,
  categories: Array<Category>,
  { maxCategories = DEFAULT_MAX_CATEGORIES, drill }: { maxCategories?: number; drill?: CashflowDrill | null } = {}
): CashflowData {
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const incomeByCat = new Map<string, number>()
  const expenseByCat = new Map<string, number>()

  for (const e of expenses) {
    if (e.amount === 0) continue
    const target = e.amount > 0 ? incomeByCat : expenseByCat
    target.set(e.categoryId, (target.get(e.categoryId) ?? 0) + Math.abs(e.amount))
  }

  const toEntries = (map: Map<string, number>): Array<Entry> =>
    Array.from(map.entries())
      .map(([id, value]) => {
        const cat = catMap.get(id)
        return { name: cat?.name ?? 'Uncategorized', color: cat?.color ?? UNCATEGORIZED_COLOR, value }
      })
      .sort((a, b) => b.value - a.value)

  if (drill && drill.depth > 0) {
    return buildDrillData(toEntries(drill.side === 'source' ? incomeByCat : expenseByCat), drill, maxCategories)
  }

  const incomes = groupTail(toEntries(incomeByCat), maxCategories)
  const outgoings = groupTail(toEntries(expenseByCat), maxCategories)
  const totalIncome = incomes.reduce((s, i) => s + i.value, 0)
  const totalExpenses = outgoings.reduce((s, i) => s + i.value, 0)
  if (totalIncome === 0 && totalExpenses === 0) return EMPTY

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

/**
 * Two-column view of one "Other" node: each level skips the `max - 1` categories shown above it,
 * so the remainder is grouped again and can be drilled further.
 */
function buildDrillData(sorted: Array<Entry>, { side, depth }: CashflowDrill, max: number): CashflowData {
  const tail = sorted.slice(depth * (max - 1))
  if (tail.length === 0) return EMPTY
  const items = groupTail(tail, max).map((e) => ({ ...e, side }))
  const root: CashflowNode = {
    name: side === 'sink' ? 'Other expenses' : 'Other income',
    color: OTHER_COLOR,
    value: sum(tail),
    side: 'hub',
  }

  if (side === 'sink') {
    return { nodes: [root, ...items], links: items.map((e, i) => ({ source: 0, target: i + 1, value: e.value })) }
  }
  return { nodes: [...items, root], links: items.map((e, i) => ({ source: i, target: items.length, value: e.value })) }
}
