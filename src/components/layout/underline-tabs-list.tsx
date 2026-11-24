import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'

export type UnderlineTab<T extends string> = { value: T; label: string; icon: LucideIcon }

type Props<T extends string> = {
  tabs: Array<UnderlineTab<T>>
  activeTab: T
}

/** Full-width underline tab bar with icons; scrolls horizontally when the tabs don't fit. */
export function UnderlineTabsList<T extends string>({ tabs, activeTab }: Props<T>) {
  const listRef = useRef<HTMLDivElement>(null)

  const activeIndex = tabs.findIndex((tab) => tab.value === activeTab)

  // On phones the active tab can sit off-screen, so bring it into view whenever it changes
  useEffect(() => {
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [activeIndex])

  return (
    <TabsList
      ref={listRef}
      className="w-full [scrollbar-width:none] justify-start gap-0 overflow-x-auto border-b pb-[5px] group-data-horizontal/tabs:h-auto [&::-webkit-scrollbar]:hidden"
      variant="line"
    >
      {/* Phones show labels only on the active tab so the whole bar fits without horizontal scrolling */}
      {tabs.map(({ value, label, icon: Icon }) => (
        <TabsTrigger key={value} aria-label={label} className="group/trigger h-9 flex-none px-2.5 sm:px-3" title={label} value={value}>
          <Icon />
          <span className="max-sm:hidden max-sm:group-data-active/trigger:inline">{label}</span>
        </TabsTrigger>
      ))}
    </TabsList>
  )
}
