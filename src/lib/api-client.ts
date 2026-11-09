import { createIsomorphicFn } from '@tanstack/react-start'

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

async function parseResponse<T>(response: Response): Promise<T> {
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
    const message = typeof body === 'object' && body !== null && 'error' in body ? String(body.error) : response.statusText
    throw new ApiError(message || 'Request failed', response.status, body)
  }

  return body as T
}

const fetchApi = createIsomorphicFn()
  .server(async (path: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers)
    if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    // In-process dispatch: a network self-fetch to the public URL fails ("fetch failed") behind proxies/Docker
    const { fetch: nitroFetch } = await import('nitro/app')
    const response = await nitroFetch(path, { ...init, headers })
    return parseResponse(response)
  })
  .client(async (path: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers)
    if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    const response = await fetch(path, { ...init, headers })
    return parseResponse(response)
  })

export function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return fetchApi(path, init) as Promise<T>
}
