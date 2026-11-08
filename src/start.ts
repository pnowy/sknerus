import { createMiddleware, createStart } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { errorResponse } from '@/lib/server/api/http'
import { isAuthEnabled, isAuthorized } from '@/lib/server/auth'

const LOGIN_API_PATH = '/api/v1/auth/login'

const authMiddleware = createMiddleware({ type: 'request' }).server(async ({ next }) => {
  const request = getRequest()
  const url = new URL(request.url)

  if (url.pathname === '/login') {
    if (!isAuthEnabled() || isAuthorized(request)) return Response.redirect(new URL('/', url), 302)
    return next()
  }

  if (!isAuthEnabled() || url.pathname === LOGIN_API_PATH) return next()

  if (isAuthorized(request)) return next()
  if (url.pathname.startsWith('/api/')) return errorResponse('Unauthorized', 401)
  return Response.redirect(new URL('/login', url), 302)
})

export const startInstance = createStart(() => ({ requestMiddleware: [authMiddleware] }))
