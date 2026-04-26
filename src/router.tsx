import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import NotFound from '@/not-found.tsx'
import * as TanstackQuery from './integrations/tanstack-query/root-provider'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const tanstackQueryCtx = TanstackQuery.getContext()

  const router = createTanStackRouter({
    routeTree,
    context: { ...tanstackQueryCtx },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultNotFoundComponent: NotFound,
    defaultPreloadStaleTime: 0,
    Wrap: (props: { children: React.ReactNode }) => {
      return <TanstackQuery.Provider {...tanstackQueryCtx}>{props.children}</TanstackQuery.Provider>
    },
  })

  setupRouterSsrQueryIntegration({ router, queryClient: tanstackQueryCtx.queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
