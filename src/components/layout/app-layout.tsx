import { Link } from '@tanstack/react-router'
import { Car, CreditCard, LayoutDashboard, Settings, Table } from 'lucide-react'
import { useConfig } from '@/hooks/use-expenses'
import { useSubscriptions } from '@/hooks/use-subscriptions'
import { todayISO } from '@/lib/shared/date-utils'
import { dueRenewals } from '@/lib/shared/subscription-utils'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/table', label: 'Transactions', icon: Table },
  { to: '/vehicles', label: 'Vehicles', icon: Car },
  { to: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const

type Props = {
  children: React.ReactNode
  // grow beyond the default width (up to max-w-7xl) only when the content needs it, e.g. wide tables
  wide?: boolean
}

export function AppLayout({ children, wide = false }: Props) {
  const { data: config } = useConfig()
  const subscriptionsEnabled = config?.features?.subscriptionTracking ?? false
  const { data: subscriptions = [] } = useSubscriptions(subscriptionsEnabled)
  const dueCount = subscriptionsEnabled ? dueRenewals(subscriptions, todayISO()).length : 0
  const vehiclesEnabled = config?.features?.vehicleExpenseTracking ?? false
  const links = NAV_LINKS.filter(
    (link) => (link.to !== '/subscriptions' || subscriptionsEnabled) && (link.to !== '/vehicles' || vehiclesEnabled)
  )
  const width = wide ? 'max-w-7xl sm:w-fit sm:min-w-[min(64rem,100%)]' : 'max-w-5xl'

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-border bg-background sticky top-0 z-10 border-b px-4 py-3">
        <nav className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" search={(prev) => prev} className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <img alt="Sknerus logo" className="size-9 rounded-full object-cover" src="/logo.png" />
            <span className="text-lg font-semibold tracking-tight">Sknerus</span>
          </Link>
          <div className="flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                search={(prev) => prev}
                activeProps={{ className: 'bg-muted text-foreground' }}
                className={cn(
                  'text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors'
                )}
              >
                <span className="relative">
                  <Icon className="size-4" />
                  {to === '/subscriptions' && dueCount > 0 && (
                    <span className="bg-destructive absolute -top-1.5 -right-1.5 flex size-3.5 items-center justify-center rounded-full text-[9px] leading-none font-semibold text-white">
                      {dueCount}
                      <span className="sr-only"> renewal{dueCount === 1 ? '' : 's'} due</span>
                    </span>
                  )}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </header>
      {/* extra bottom padding on mobile so the floating add button never covers content */}
      <main className={cn('mx-auto w-full flex-1 px-4 pt-6 pb-24 sm:pb-6', width)}>{children}</main>
    </div>
  )
}
