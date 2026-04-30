import { Link } from '@tanstack/react-router'
import { LayoutDashboard, Settings, Table } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/table', label: 'Table', icon: Table },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-border border-b bg-background px-4 py-3">
        <nav className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" search={(prev) => prev} className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <img alt="Sknerus logo" className="size-9 rounded-full object-cover" src="/logo.png" />
            <span className="font-semibold text-lg tracking-tight">Sknerus</span>
          </Link>
          <div className="flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                search={(prev) => prev}
                activeProps={{ className: 'bg-muted text-foreground' }}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground'
                )}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  )
}
