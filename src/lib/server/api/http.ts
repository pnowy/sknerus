import { z } from 'zod'
import { BadRequestError, NotFoundError } from '@/lib/server/services/errors'

export function jsonResponse(data: unknown, status = 200, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers)
  responseHeaders.set('Content-Type', 'application/json; charset=utf-8')
  return new Response(JSON.stringify(data), { status, headers: responseHeaders })
}

export function errorResponse(error: string, status: number, extra: Record<string, unknown> = {}): Response {
  return jsonResponse({ error, ...extra }, status)
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new BadRequestError('Invalid JSON')
  }
}

export function handleErrors<Args extends Array<unknown>>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (error) {
      if (error instanceof NotFoundError) return errorResponse(error.message, 404)
      if (error instanceof BadRequestError) return errorResponse(error.message, 400)
      if (error instanceof z.ZodError) return errorResponse('Validation failed', 400, { issues: error.issues })
      return errorResponse('Internal server error', 500)
    }
  }
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
