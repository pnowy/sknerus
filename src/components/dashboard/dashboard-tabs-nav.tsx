import { ChartColumn, ChartPie, Scale, TrendingUp, Waves } from 'lucide-react'
import { type UnderlineTab, UnderlineTabsList } from '@/components/layout/underline-tabs-list'
import { DashboardTab } from '@/lib/shared/types/dashboard-tab'

const TABS: Array<UnderlineTab<DashboardTab>> = [
  { value: DashboardTab.Breakdown, label: 'Breakdown', icon: ChartPie },
  { value: DashboardTab.Monthly, label: 'Monthly', icon: ChartColumn },
  { value: DashboardTab.Trends, label: 'Trends', icon: TrendingUp },
  { value: DashboardTab.Balance, label: 'Income vs Expenses', icon: Scale },
  { value: DashboardTab.Cashflow, label: 'Cashflow', icon: Waves },
]

type Props = {
  activeTab: DashboardTab
}

export function DashboardTabsNav({ activeTab }: Props) {
  return <UnderlineTabsList activeTab={activeTab} tabs={TABS} />
}
