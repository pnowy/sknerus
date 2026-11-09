import { useEffect, useRef } from 'react'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardTab } from '@/lib/shared/types/dashboard-tab'

const TABS: Array<{ value: DashboardTab; label: string }> = [
  { value: DashboardTab.Breakdown, label: 'Breakdown' },
  { value: DashboardTab.Monthly, label: 'Monthly' },
  { value: DashboardTab.Trends, label: 'Trends' },
  { value: DashboardTab.Balance, label: 'Income vs Expenses' },
  { value: DashboardTab.Cashflow, label: 'Cashflow' },
]

type Props = {
  activeTab: DashboardTab
}

export function DashboardTabsNav({ activeTab }: Props) {
  const listRef = useRef<HTMLDivElement>(null)

  // On phones the chips can sit off-screen, so bring the active one into view whenever it changes.
  useEffect(() => {
    const index = TABS.findIndex((tab) => tab.value === activeTab)
    listRef.current?.children[index]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [activeTab])

  return (
    <TabsList
      ref={listRef}
      className="max-sm:h-auto max-sm:w-full max-sm:[scrollbar-width:none] max-sm:justify-start max-sm:gap-2 max-sm:overflow-x-auto max-sm:bg-transparent max-sm:p-0 max-sm:[&::-webkit-scrollbar]:hidden"
    >
      {TABS.map(({ value, label }) => (
        <TabsTrigger
          key={value}
          value={value}
          className="max-sm:border-border max-sm:data-active:border-primary max-sm:data-active:bg-primary max-sm:data-active:text-primary-foreground max-sm:h-8 max-sm:flex-none max-sm:rounded-full max-sm:px-3.5"
        >
          {label}
        </TabsTrigger>
      ))}
    </TabsList>
  )
}
