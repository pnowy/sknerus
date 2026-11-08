import { z } from 'zod'
import { errorResponse, handleErrors, isObject, jsonResponse, readJson } from '@/lib/server/api/http'
import { clearSessionCookieHeader, isApiTokenValid, isAuthEnabled, sessionCookieHeader } from '@/lib/server/auth'

export const loginHandler = handleErrors(async (request: Request) => {
  const body = await readJson(request)
  if (!isObject(body)) return errorResponse('Validation failed', 400)
  const parsed = z.object({ token: z.string().min(1) }).safeParse(body)
  if (!parsed.success) return errorResponse('Validation failed', 400, { issues: parsed.error.issues })
  if (isAuthEnabled() && !isApiTokenValid(parsed.data.token)) return errorResponse('Unauthorized', 401)

  const headers = isAuthEnabled() ? { 'Set-Cookie': sessionCookieHeader(request, parsed.data.token) } : undefined
  return jsonResponse({ success: true }, 200, headers)
})

export const logoutHandler = handleErrors(async (request: Request) =>
  jsonResponse({ success: true }, 200, { 'Set-Cookie': clearSessionCookieHeader(request) })
)

export const authStatusHandler = handleErrors(async () => jsonResponse({ authEnabled: isAuthEnabled() }))
