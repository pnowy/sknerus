import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { ThemeProvider } from 'next-themes'
import { useEffect } from 'react'
import { z } from 'zod'
import { Toaster } from '@/components/ui/sonner'
import { materializeRecurring } from '@/lib/server/functions/recurring'
import { DashboardTab } from '@/lib/shared/types/dashboard-tab'
import { RangeScope } from '@/lib/shared/types/range-scope'
import appCss from '@/styles/styles.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  validateSearch: z.object({
    scope: z.enum(Object.values(RangeScope) as [RangeScope, ...Array<RangeScope>]).default(RangeScope.Month),
    offset: z.number().int().default(0),
    tab: z.enum(Object.values(DashboardTab) as [DashboardTab, ...Array<DashboardTab>]).default(DashboardTab.Breakdown),
  }),
  loader: () => materializeRecurring(),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Sknerus' },
      { name: 'theme-color', content: '#09090b' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-title', content: 'Sknerus' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.json' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { queryClient } = Route.useRouteContext()

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js')
    } else {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const r of registrations) r.unregister()
      })
    }
  }, [])
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
          <QueryClientProvider client={queryClient}>
            {children}
            <Toaster richColors position="bottom-right" />
          </QueryClientProvider>
        </ThemeProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: 'Tanstack Query',
              render: <ReactQueryDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
