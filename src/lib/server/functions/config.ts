import { createServerFn } from '@tanstack/react-start'
import { configSchema } from 'src/lib/schemas'
import { z } from 'zod'
import { readConfig, readExpenses, writeConfig, writeExpenses } from '../storage.server'

export const getConfig = createServerFn({ method: 'GET' }).handler(async () => readConfig())

export const updateConfig = createServerFn({ method: 'POST' })
  .inputValidator(configSchema)
  .handler(async ({ data }) => {
    writeConfig(data)
    return data
  })

export const renameCategory = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ oldName: z.string().min(1), newName: z.string().min(1) }))
  .handler(async ({ data: { oldName, newName } }) => {
    const config = readConfig()
    writeConfig({
      ...config,
      categories: config.categories.map((c) => (c.name === oldName ? { ...c, name: newName } : c)),
    })
    const expenses = readExpenses()
    writeExpenses(expenses.map((e) => (e.category === oldName ? { ...e, category: newName } : e)))
    return { ok: true }
  })
