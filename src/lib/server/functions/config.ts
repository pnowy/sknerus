import { createServerFn } from '@tanstack/react-start'
import { configSchema } from 'src/lib/schemas'
import { readConfig, writeConfig } from '../storage.server'

export const getConfig = createServerFn({ method: 'GET' }).handler(async () => readConfig())

export const updateConfig = createServerFn({ method: 'POST' })
  .inputValidator(configSchema)
  .handler(async ({ data }) => {
    writeConfig(data)
    return data
  })
