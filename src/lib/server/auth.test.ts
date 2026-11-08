import { afterEach, describe, expect, it, vi } from 'vitest'
import { isAuthEnabled, isAuthorized, SESSION_COOKIE_NAME, sessionCookieValue } from '@/lib/server/auth'

afterEach(() => vi.unstubAllEnvs())

describe('API authentication', () => {
  it('allows requests when API_TOKEN is unset', () => {
    vi.stubEnv('API_TOKEN', '')

    expect(isAuthEnabled()).toBe(false)
    expect(isAuthorized(new Request('http://localhost/api/v1/expenses'))).toBe(true)
  })

  it('accepts a matching bearer token and rejects absent or incorrect credentials', () => {
    vi.stubEnv('API_TOKEN', 'secret-token')

    expect(isAuthorized(new Request('http://localhost/api/v1/expenses', { headers: { Authorization: 'Bearer secret-token' } }))).toBe(true)
    expect(isAuthorized(new Request('http://localhost/api/v1/expenses'))).toBe(false)
    expect(isAuthorized(new Request('http://localhost/api/v1/expenses', { headers: { Authorization: 'Bearer wrong-token' } }))).toBe(false)
  })

  it('accepts the hashed session cookie and still supports bearer access', () => {
    vi.stubEnv('API_TOKEN', 'secret-token')
    const request = new Request('http://localhost/api/v1/expenses', {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${sessionCookieValue('secret-token')}` },
    })

    expect(isAuthorized(request)).toBe(true)
    expect(isAuthorized(new Request(request.url, { headers: { Cookie: `${SESSION_COOKIE_NAME}=invalid` } }))).toBe(false)
  })
})
