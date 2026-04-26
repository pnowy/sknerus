import { createServerFn } from '@tanstack/react-start'
import { configSchema } from '@/lib/schemas'
import { readConfig, writeConfig } from './storage'

export const getConfig = createServerFn({ method: 'GET' }).handler(async () => readConfig())

export const updateConfig = createServerFn({ method: 'POST' })
  .inputValidator(configSchema)
  .handler(async ({ data }) => {
    writeConfig(data)
    return data
  })
