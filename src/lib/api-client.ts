import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeaders, getRequestUrl } from '@tanstack/react-start/server'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function parseResponse<T>(response: Response, redirectOnUnauthorized: boolean): Promise<T> {
  let body: unknown
  const text = await response.text()
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }

  if (!response.ok) {
    if (response.status === 401 && redirectOnUnauthorized && window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
    const message = typeof body === 'object' && body !== null && 'error' in body ? String(body.error) : response.statusText
    throw new ApiError(message || 'Request failed', response.status, body)
  }

  return body as T
}

const fetchApi = createIsomorphicFn()
  .server(async (path: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers)
    const requestHeaders = getRequestHeaders()
    for (const name of ['cookie', 'authorization']) {
      const value = requestHeaders.get(name)
      if (value && !headers.has(name)) headers.set(name, value)
    }

    const url = new URL(path, getRequestUrl())
    const response = await fetch(url, { ...init, headers })
    return parseResponse(response, false)
  })
  .client(async (path: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers)
    if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    const response = await fetch(path, { ...init, headers, credentials: 'same-origin' })
    return parseResponse(response, true)
  })

export function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return fetchApi(path, init) as Promise<T>
}
