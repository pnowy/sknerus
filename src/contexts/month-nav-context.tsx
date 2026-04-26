import { createContext, useContext, useState } from 'react'

type MonthNavContextValue = {
  offset: number
  setOffset: (updater: (prev: number) => number) => void
}

const MonthNavContext = createContext<MonthNavContextValue | null>(null)

export function MonthNavProvider({ children }: { children: React.ReactNode }) {
  const [offset, setOffset] = useState(0)
  return <MonthNavContext value={{ offset, setOffset }}>{children}</MonthNavContext>
}

export function useMonthNavContext(): MonthNavContextValue {
  const ctx = useContext(MonthNavContext)
  if (!ctx) throw new Error('useMonthNavContext must be used inside MonthNavProvider')
  return ctx
}
