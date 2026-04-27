import { createServerFn } from '@tanstack/react-start'
import { configSchema } from 'src/lib/schemas'
import { z } from 'zod'
import { readConfig, writeConfig } from '../storage.server'

export const getConfig = createServerFn({ method: 'GET' }).handler(async () => readConfig())

export const updateConfig = createServerFn({ method: 'POST' })
  .inputValidator(configSchema)
  .handler(async ({ data }) => {
    writeConfig(data)
    return data
  })

export const renameCategory = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string().min(1), newName: z.string().min(1) }))
  .handler(async ({ data: { id, newName } }) => {
    const config = readConfig()
    writeConfig({
      ...config,
      categories: config.categories.map((c) => (c.id === id ? { ...c, name: newName } : c)),
    })
    return { ok: true }
  })
