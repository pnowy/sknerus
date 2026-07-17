import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { configSchema } from '@/lib/schemas'
import { storage } from '@/lib/server/storage'

export const getConfig = createServerFn({ method: 'GET' }).handler(() => storage.getConfig())

export const updateConfig = createServerFn({ method: 'POST' })
  .validator(configSchema)
  .handler(async ({ data }) => {
    await storage.saveConfig(data)
    return data
  })

export const renameCategory = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1), newName: z.string().min(1) }))
  .handler(async ({ data: { id, newName } }) => {
    const config = await storage.getConfig()
    await storage.saveConfig({
      ...config,
      categories: config.categories.map((c) => (c.id === id ? { ...c, name: newName } : c)),
    })
    return { ok: true }
  })
