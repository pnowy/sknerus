import { z } from 'zod'
import { configSchema } from '@/lib/schemas'
import { handleErrors, isObject, jsonResponse, readJson } from '@/lib/server/api/http'
import { getConfig, renameCategory, updateConfig } from '@/lib/server/services/config.service'
import { BadRequestError } from '@/lib/server/services/errors'

export const getConfigHandler = handleErrors(async () => jsonResponse(await getConfig()))

export const updateConfigHandler = handleErrors(async (request: Request) => {
  const parsed = configSchema.parse(await readJson(request))
  return jsonResponse(await updateConfig(parsed))
})

export const getCategoriesHandler = handleErrors(async () => jsonResponse((await getConfig()).categories))

export const renameCategoryHandler = handleErrors(async (request: Request, id: string) => {
  const body = await readJson(request)
  if (!isObject(body)) throw new BadRequestError('Expected a JSON object')
  const parsed = z.object({ newName: z.string().min(1) }).parse(body)
  return jsonResponse(await renameCategory(id, parsed.newName))
})
