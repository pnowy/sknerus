import { createHash, timingSafeEqual } from 'node:crypto'

export const SESSION_COOKIE_NAME = 'sknerus_session'

export function isAuthEnabled(): boolean {
  return Boolean(process.env.API_TOKEN)
}

function safeEqual(left: string, right: string): boolean {
  const leftHash = createHash('sha256').update(left).digest()
  const rightHash = createHash('sha256').update(right).digest()
  return timingSafeEqual(leftHash, rightHash)
}

export function isApiTokenValid(candidate: string): boolean {
  const token = process.env.API_TOKEN
  return Boolean(token && safeEqual(candidate, token))
}

export function sessionCookieValue(token = process.env.API_TOKEN ?? ''): string {
  return createHash('sha256').update(token).digest('hex')
}

function getCookie(request: Request, name: string): string | undefined {
  const cookie = request.headers.get('Cookie')
  if (!cookie) return undefined

  for (const part of cookie.split(';')) {
    const [key, ...value] = part.trim().split('=')
    if (key === name) return value.join('=')
  }
  return undefined
}

export function isAuthorized(request: Request): boolean {
  const token = process.env.API_TOKEN
  if (!token) return true

  const authorization = request.headers.get('Authorization')
  const match = authorization?.match(/^Bearer\s+(.+)$/i)
  if (match && safeEqual(match[1], token)) return true

  const cookieValue = getCookie(request, SESSION_COOKIE_NAME)
  return cookieValue !== undefined && safeEqual(cookieValue, sessionCookieValue(token))
}

export function sessionCookieHeader(request: Request, token = process.env.API_TOKEN ?? ''): string {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${SESSION_COOKIE_NAME}=${sessionCookieValue(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000${secure}`
}

export function clearSessionCookieHeader(request: Request): string {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`
}
