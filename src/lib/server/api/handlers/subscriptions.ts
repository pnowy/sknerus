import { bookPaymentSchema, importRecurringSchema, subscriptionPayloadSchema } from '@/lib/schemas'
import { handleErrors, isObject, jsonResponse, readJson } from '@/lib/server/api/http'
import { BadRequestError } from '@/lib/server/services/errors'
import {
  bookPayment,
  createSubscription,
  importFromRecurring,
  listSubscriptions,
  removeSubscription,
  skipRenewal,
  updateSubscription,
} from '@/lib/server/services/subscriptions.service'

export const getSubscriptionsHandler = handleErrors(async () => jsonResponse(await listSubscriptions()))

export const createSubscriptionHandler = handleErrors(async (request: Request) => {
  const parsed = subscriptionPayloadSchema.parse(await readJson(request))
  return jsonResponse(await createSubscription(parsed), 201)
})

export const updateSubscriptionHandler = handleErrors(async (request: Request, id: string) => {
  const body = await readJson(request)
  if (!isObject(body)) throw new BadRequestError('Expected a JSON object')
  const { id: _ignored, ...rest } = body
  const parsed = subscriptionPayloadSchema.parse(rest)
  return jsonResponse(await updateSubscription(id, parsed))
})

export const deleteSubscriptionHandler = handleErrors(async (request: Request, id: string) => {
  const withRecurring = new URL(request.url).searchParams.get('withRecurring') === 'true'
  return jsonResponse(await removeSubscription(id, withRecurring))
})

export const importRecurringSubscriptionsHandler = handleErrors(async (request: Request) => {
  const parsed = importRecurringSchema.parse(await readJson(request))
  return jsonResponse(await importFromRecurring(parsed.recurringIds, parsed.deductionProfileId), 201)
})

export const bookPaymentHandler = handleErrors(async (request: Request, id: string) => {
  const parsed = bookPaymentSchema.parse(await readJson(request))
  return jsonResponse(await bookPayment(id, parsed), 201)
})

export const skipRenewalHandler = handleErrors(async (_request: Request, id: string) => jsonResponse(await skipRenewal(id)))
