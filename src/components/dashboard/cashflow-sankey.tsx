import { ArrowLeft } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import {
  buildCashflowData,
  type CashflowDrill,
  type CashflowNode,
  countCashflowCategories,
  getSankeyNodePadding,
  getSankeyPlotHeight,
} from '@/lib/shared/cashflow-utils'
import { formatCurrency } from '@/lib/shared/format'
import type { Category, Expense } from '@/lib/shared/types/expense'

type Props = {
  expenses: Array<Expense>
  categories: Array<Category>
  currency: string
}

const MARGIN = { top: 10, right: 130, bottom: 28, left: 10 }
// Smallest chart height (h-96) minus vertical margins — padding must fit on every breakpoint.
const MIN_PLOT_HEIGHT = 384 - MARGIN.top - MARGIN.bottom

type NodeRenderProps = { x: number; y: number; width: number; height: number; payload: CashflowNode }
type LinkPayload = { source: CashflowNode; target: CashflowNode }
type DrillableSide = CashflowDrill['side']

const PRIMARY = 'var(--primary)'
const DEFAULT_LIMIT = 8
const LIMIT_OPTIONS = [8, 12, 16, Number.POSITIVE_INFINITY]
const LIMIT_STORAGE_KEY = 'sknerus.cashflow.maxCategories'

function readStoredLimit(): number {
  try {
    const stored = window.localStorage.getItem(LIMIT_STORAGE_KEY)
    const limit = stored === 'all' ? Number.POSITIVE_INFINITY : Number(stored)
    return LIMIT_OPTIONS.includes(limit) ? limit : DEFAULT_LIMIT
  } catch {
    return DEFAULT_LIMIT
  }
}

function storeLimit(limit: number) {
  try {
    window.localStorage.setItem(LIMIT_STORAGE_KEY, Number.isFinite(limit) ? String(limit) : 'all')
  } catch {
    // Storage can be unavailable (private mode); the limit just won't be remembered.
  }
}

/** Side of the drillable "Other" node a link leads to or from, if any. */
function otherSideOf(link: LinkPayload): DrillableSide | null {
  const end = link.source.side === 'hub' ? link.target : link.source
  return end.isOther && end.side !== 'hub' ? end.side : null
}

export function CashflowSankey({ expenses, categories, currency }: Props) {
  const hatchId = `${useId()}-other-hatch`
  const [hoveredOther, setHoveredOther] = useState<DrillableSide | null>(null)
  const [mounted, setMounted] = useState(false)
  const [maxCategories, setMaxCategories] = useState(DEFAULT_LIMIT)
  useEffect(() => {
    setMaxCategories(readStoredLimit())
    setMounted(true)
  }, [])

  // Drill state is tied to the expenses it was made for, so changing the period resets it without an effect.
  const [drillState, setDrillState] = useState<{ drill: CashflowDrill; expenses: Array<Expense> } | null>(null)
  const drill = drillState?.expenses === expenses ? drillState.drill : null

  const data = useMemo(
    () => buildCashflowData(expenses, categories, { drill, maxCategories }),
    [expenses, categories, drill, maxCategories]
  )
  const categoryCount = useMemo(() => countCashflowCategories(expenses), [expenses])
  const showLimitPicker = Math.max(categoryCount.income, categoryCount.expense) > DEFAULT_LIMIT

  // More categories get more height instead of tighter gaps, so labels stay readable at any limit.
  const { plotHeight, nodePadding } = useMemo(() => {
    const perSide = (side: CashflowNode['side']) => data.nodes.filter((n) => n.side === side).length
    const maxNodes = Math.max(perSide('source'), perSide('sink'))
    const height = getSankeyPlotHeight(maxNodes, MIN_PLOT_HEIGHT)
    return { plotHeight: height, nodePadding: getSankeyNodePadding(maxNodes, height) }
  }, [data])

  const changeLimit = (limit: number) => {
    setDrillState(null)
    setMaxCategories(limit)
    storeLimit(limit)
  }

  const drillInto = (side: DrillableSide | null) => {
    if (!side) return
    const depth = drill?.side === side ? drill.depth + 1 : 1
    setHoveredOther(null)
    setDrillState({ drill: { side, depth }, expenses })
  }

  // Recharts passes the node payload for nodes and { source, target } for links.
  const drillableSideOf = (payload: unknown, type: string): DrillableSide | null => {
    if (type === 'link') return otherSideOf(payload as LinkPayload)
    const node = payload as CashflowNode
    return node.isOther && node.side !== 'hub' ? node.side : null
  }

  const drillUp = () => {
    if (!drill) return
    setDrillState(drill.depth > 1 ? { drill: { ...drill, depth: drill.depth - 1 }, expenses } : null)
  }

  if (data.nodes.length === 0) {
    return (
      <div className="bg-chart-paper text-muted-foreground flex min-h-48 items-center justify-center rounded-xl border border-black/20 text-sm shadow-sm dark:border-white/10">
        No data for this period
      </div>
    )
  }

  const renderNode = ({ x, y, width, height, payload }: NodeRenderProps) => {
    // Sink labels sit left of the bar so they stay inside the right margin-free edge.
    const isSink = payload.side === 'sink'
    const labelX = isSink ? x - 8 : x + width + 8
    const anchor = isSink ? 'end' : 'start'
    const midY = y + height / 2
    return (
      <g className={payload.isOther ? 'cursor-pointer' : undefined}>
        {payload.isOther ? (
          <>
            <defs>
              <pattern height={5} id={hatchId} patternTransform="rotate(45)" patternUnits="userSpaceOnUse" width={5}>
                <rect fill={payload.color} fillOpacity={0.35} height={5} width={5} />
                <line stroke={payload.color} strokeWidth={3} x1={0} x2={0} y1={0} y2={5} />
              </pattern>
            </defs>
            <rect
              fill={`url(#${hatchId})`}
              height={Math.max(height, 2)}
              rx={2}
              style={{ stroke: hoveredOther === payload.side ? PRIMARY : payload.color }}
              width={width}
              x={x}
              y={y}
            />
          </>
        ) : (
          <rect x={x} y={y} width={width} height={Math.max(height, 2)} fill={payload.color} rx={2} />
        )}
        <text x={labelX} y={midY - 2} textAnchor={anchor} fontSize={12} fontWeight={500} fill="currentColor">
          {payload.name}
          {payload.isOther && (
            <tspan fontWeight={700} style={{ fill: PRIMARY }}>
              {` +${payload.groupedCount} ›››`}
            </tspan>
          )}
        </text>
        <text x={labelX} y={midY + 11} textAnchor={anchor} fontSize={11} fontFamily="monospace" fill="currentColor" opacity={0.6}>
          {formatCurrency(payload.value, currency)}
        </text>
      </g>
    )
  }

  const renderLink = (props: {
    sourceX: number
    targetX: number
    sourceY: number
    targetY: number
    sourceControlX: number
    targetControlX: number
    linkWidth: number
    payload: LinkPayload
  }) => {
    const { sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, payload } = props
    // Color by the non-hub end so each flow carries its category color.
    const color = payload.source.side === 'hub' ? payload.target.color : payload.source.color
    const side = otherSideOf(payload)
    const highlighted = side !== null && side === hoveredOther
    return (
      <path
        className={side ? 'cursor-pointer' : undefined}
        d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
        fill="none"
        strokeOpacity={highlighted ? 0.4 : 0.25}
        strokeWidth={Math.max(linkWidth, 1)}
        style={{ stroke: highlighted ? PRIMARY : color }}
      />
    )
  }

  return (
    <div className="bg-chart-paper overflow-x-auto rounded-xl border border-black/20 p-4 shadow-sm dark:border-white/10">
      {/* Min width keeps labels readable on phones; the container scrolls horizontally instead. */}
      {showLimitPicker && (
        <div className="mb-2 flex items-center justify-end gap-1 text-xs">
          <span className="text-muted-foreground mr-1">Categories</span>
          {LIMIT_OPTIONS.map((limit) => (
            <Button key={limit} onClick={() => changeLimit(limit)} size="sm" variant={limit === maxCategories ? 'default' : 'outline'}>
              {Number.isFinite(limit) ? limit : 'All'}
            </Button>
          ))}
        </div>
      )}
      {drill && (
        <div className="mb-2 flex items-center gap-2 text-sm">
          <Button onClick={drillUp} size="sm" variant="ghost">
            <ArrowLeft />
            Back
          </Button>
          <span className="text-muted-foreground">
            {drill.side === 'sink' ? 'Other expenses' : 'Other income'}
            {drill.depth > 1 && ` · level ${drill.depth}`}
          </span>
        </div>
      )}
      <div className="h-96 min-w-[640px] md:h-[520px]" style={{ minHeight: plotHeight + MARGIN.top + MARGIN.bottom }}>
        {mounted && (
          <ResponsiveContainer height="100%" width="100%">
            <Sankey
              data={data}
              link={renderLink as never}
              node={renderNode as never}
              nodePadding={nodePadding}
              nodeWidth={12}
              onClick={(item, type) => drillInto(drillableSideOf(item.payload, type))}
              onMouseEnter={(item, type) => setHoveredOther(drillableSideOf(item.payload, type))}
              onMouseLeave={() => setHoveredOther(null)}
              margin={MARGIN}
              sort={false}
            >
              <Tooltip
                formatter={(value, name, entry) => {
                  const formatted = formatCurrency(Number(value), currency)
                  const isOther = (entry?.payload as CashflowNode | undefined)?.isOther
                  return isOther ? [formatted, `${name} · click to expand`] : formatted
                }}
                contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '0.8rem' }}
                itemStyle={{ color: '#f4f4f4' }}
                labelStyle={{ color: '#f4f4f4', fontWeight: 600 }}
              />
            </Sankey>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
