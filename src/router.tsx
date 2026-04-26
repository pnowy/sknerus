import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import NotFound from "@/not-found.tsx";
import * as TanstackQuery from './integrations/tanstack-query/root-provider'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const qcContext = TanstackQuery.getContext()

  const router = createTanStackRouter({
    routeTree,
    context: { ...qcContext },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultNotFoundComponent: NotFound,
    defaultPreloadStaleTime: 0,
    Wrap: (props: { children: React.ReactNode }) => {
      return <TanstackQuery.Provider {...qcContext}>{props.children}</TanstackQuery.Provider>
    },
  })

  setupRouterSsrQueryIntegration({ router, queryClient: qcContext.queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
