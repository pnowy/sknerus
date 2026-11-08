import { vehicleSchema } from '@/lib/schemas'
import { handleErrors, isObject, jsonResponse, readJson } from '@/lib/server/api/http'
import { BadRequestError } from '@/lib/server/services/errors'
import { createVehicle, listVehicles, removeVehicle, updateVehicle } from '@/lib/server/services/vehicles.service'

export const getVehiclesHandler = handleErrors(async () => jsonResponse(await listVehicles()))

export const createVehicleHandler = handleErrors(async (request: Request) => {
  const parsed = vehicleSchema.omit({ id: true }).parse(await readJson(request))
  return jsonResponse(await createVehicle(parsed), 201)
})

export const updateVehicleHandler = handleErrors(async (request: Request, id: string) => {
  const body = await readJson(request)
  if (!isObject(body)) throw new BadRequestError('Expected a JSON object')
  const parsed = vehicleSchema.parse({ ...body, id })
  return jsonResponse(await updateVehicle(parsed))
})

export const deleteVehicleHandler = handleErrors(async (_request: Request, id: string) => jsonResponse(await removeVehicle(id)))
