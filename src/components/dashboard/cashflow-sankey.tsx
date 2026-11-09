import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts'
import { buildCashflowData, type CashflowNode } from '@/lib/shared/cashflow-utils'
import { formatCurrency } from '@/lib/shared/format'
import type { Category, Expense } from '@/lib/shared/types/expense'

type Props = {
  expenses: Array<Expense>
  categories: Array<Category>
  currency: string
}

type NodeRenderProps = { x: number; y: number; width: number; height: number; payload: CashflowNode }

export function CashflowSankey({ expenses, categories, currency }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const data = useMemo(() => buildCashflowData(expenses, categories), [expenses, categories])

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
      <g>
        <rect x={x} y={y} width={width} height={Math.max(height, 2)} fill={payload.color} rx={2} />
        <text x={labelX} y={midY - 2} textAnchor={anchor} fontSize={12} fontWeight={500} fill="currentColor">
          {payload.name}
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
    payload: { source: CashflowNode; target: CashflowNode }
  }) => {
    const { sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, payload } = props
    // Color by the non-hub end so each flow carries its category color.
    const color = payload.source.side === 'hub' ? payload.target.color : payload.source.color
    return (
      <path
        d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
        fill="none"
        stroke={color}
        strokeOpacity={0.25}
        strokeWidth={Math.max(linkWidth, 1)}
      />
    )
  }

  return (
    <div className="bg-chart-paper h-96 rounded-xl border border-black/20 p-4 shadow-sm md:h-[520px] dark:border-white/10">
      {mounted && (
        <ResponsiveContainer height="100%" width="100%">
          <Sankey
            data={data}
            link={renderLink as never}
            node={renderNode as never}
            nodePadding={28}
            nodeWidth={12}
            margin={{ top: 10, right: 130, bottom: 10, left: 10 }}
            sort={false}
          >
            <Tooltip
              formatter={(value) => formatCurrency(Number(value), currency)}
              contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '0.8rem' }}
              itemStyle={{ color: '#f4f4f4' }}
              labelStyle={{ color: '#f4f4f4', fontWeight: 600 }}
            />
          </Sankey>
        </ResponsiveContainer>
      )}
    </div>
  )
}
