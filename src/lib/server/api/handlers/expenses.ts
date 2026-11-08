import { z } from 'zod'
import { expenseSchema } from '@/lib/schemas'
import { handleErrors, isObject, jsonResponse, readJson } from '@/lib/server/api/http'
import { getConfig } from '@/lib/server/services/config.service'
import { BadRequestError, NotFoundError } from '@/lib/server/services/errors'
import {
  createExpense,
  getExpense,
  listExpenses,
  removeExpense,
  updateExpense,
  updateExpenseUsing,
} from '@/lib/server/services/expenses.service'

const apiExpenseSchema = expenseSchema.extend({
  currency: z.string().min(1).optional(),
  tags: z.array(z.string()).default([]),
})

async function categoryExists(categoryId: string): Promise<boolean> {
  const config = await getConfig()
  return config.categories.some((category) => category.id === categoryId)
}

export const getExpensesHandler = handleErrors(async (request: Request) => {
  const url = new URL(request.url)
  return jsonResponse(
    await listExpenses({
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
      categoryId: url.searchParams.get('categoryId') ?? undefined,
      tag: url.searchParams.get('tag') ?? undefined,
    })
  )
})

export const createExpenseHandler = handleErrors(async (request: Request) => {
  const parsed = apiExpenseSchema.parse(await readJson(request))
  const config = await getConfig()
  if (!config.categories.some((category) => category.id === parsed.categoryId)) throw new BadRequestError('Unknown category')

  const created = await createExpense({ ...parsed, currency: parsed.currency ?? config.currency })
  return jsonResponse(created, 201)
})

export const getExpenseHandler = handleErrors(async (id: string) => jsonResponse(await getExpense(id)))

export const replaceExpenseHandler = handleErrors(async (request: Request, id: string) => {
  await getExpense(id)
  const parsed = expenseSchema.parse(await readJson(request))
  if (!(await categoryExists(parsed.categoryId))) throw new BadRequestError('Unknown category')
  return jsonResponse(await updateExpense({ ...parsed, id }))
})

export const patchExpenseHandler = handleErrors(async (request: Request, id: string) => {
  const changes = await readJson(request)
  if (!isObject(changes)) throw new BadRequestError('Expected a JSON object')

  return jsonResponse(
    await updateExpenseUsing(id, async (current) => {
      const parsed = expenseSchema.safeParse({ ...current, ...changes })
      if (!parsed.success) throw parsed.error
      if (!(await categoryExists(parsed.data.categoryId))) throw new BadRequestError('Unknown category')
      return parsed.data
    })
  )
})

export const deleteExpenseHandler = handleErrors(async (id: string) => {
  const removed = await removeExpense(id)
  if (!removed) throw new NotFoundError('Expense not found')
  return jsonResponse({ success: true })
})
