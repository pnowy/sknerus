import { withWriteLock } from '@/lib/server/services/lock'
import { storage } from '@/lib/server/storage'
import type { Config } from '@/lib/shared/types/expense'

export async function getConfig() {
  return storage.getConfig()
}

export function updateConfig(config: Config): Promise<Config> {
  return withWriteLock(async () => {
    await storage.saveConfig(config)
    return config
  })
}

export function renameCategory(id: string, newName: string): Promise<{ ok: true }> {
  return withWriteLock(async () => {
    const config = await storage.getConfig()
    await storage.saveConfig({
      ...config,
      categories: config.categories.map((category) => (category.id === id ? { ...category, name: newName } : category)),
    })
    return { ok: true }
  })
}
