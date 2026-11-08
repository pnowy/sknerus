import { recurringExpenseSchema } from '@/lib/schemas'
import { handleErrors, isObject, jsonResponse, readJson } from '@/lib/server/api/http'
import { BadRequestError } from '@/lib/server/services/errors'
import {
  createRecurring,
  listRecurring,
  materializeRecurringExpenses,
  removeRecurring,
  updateRecurring,
} from '@/lib/server/services/recurring.service'

export const getRecurringHandler = handleErrors(async () => jsonResponse(await listRecurring()))

export const createRecurringHandler = handleErrors(async (request: Request) => {
  const parsed = recurringExpenseSchema.omit({ id: true }).parse(await readJson(request))
  return jsonResponse(await createRecurring(parsed), 201)
})

export const updateRecurringHandler = handleErrors(async (request: Request, id: string) => {
  const body = await readJson(request)
  if (!isObject(body)) throw new BadRequestError('Expected a JSON object')
  const parsed = recurringExpenseSchema.parse({ ...body, id })
  return jsonResponse(await updateRecurring(parsed))
})

export const deleteRecurringHandler = handleErrors(async (_request: Request, id: string) => jsonResponse(await removeRecurring(id)))

export const materializeRecurringHandler = handleErrors(async () => jsonResponse(await materializeRecurringExpenses()))
