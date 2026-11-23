import { BACKUP_VERSION, type Backup, type BackupFile } from '@/lib/schemas'
import { withWriteLock } from '@/lib/server/services/lock'
import { storage } from '@/lib/server/storage'

export type RestoreSummary = {
  expenses: number
  recurring: number
  vehicles: number
  subscriptions: number
  categories: number
}

/** Snapshot of all user data. The exchange-rate API key is left out so the file can be shared safely */
export async function exportBackup(): Promise<BackupFile> {
  const [config, expenses, recurring, vehicles, subscriptions] = await Promise.all([
    storage.getConfig(),
    storage.getExpenses(),
    storage.getRecurring(),
    storage.getVehicles(),
    storage.getSubscriptions(),
  ])
  const { exchangeApiKey: _secret, ...safeConfig } = config
  return {
    app: 'sknerus',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: { config: safeConfig, expenses, recurring, vehicles, subscriptions },
  }
}

/** Replaces all user data with the backup; the cached exchange rates are kept */
export function restoreBackup({ data }: Backup): Promise<RestoreSummary> {
  return withWriteLock(async () => {
    const current = await storage.getConfig()
    // a backup never carries the API key, so keep the one configured here
    const config = { ...data.config, exchangeApiKey: data.config.exchangeApiKey ?? current.exchangeApiKey }

    await storage.saveConfig(config)
    await storage.saveExpenses(data.expenses)
    await storage.saveRecurring(data.recurring)
    await storage.saveVehicles(data.vehicles)
    await storage.saveSubscriptions(data.subscriptions)
    return {
      expenses: data.expenses.length,
      recurring: data.recurring.length,
      vehicles: data.vehicles.length,
      subscriptions: data.subscriptions.length,
      categories: config.categories.length,
    }
  })
}
