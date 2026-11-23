import { BACKUP_VERSION, type Backup, type BackupFile } from '@/lib/schemas'
import { BadRequestError } from '@/lib/server/services/errors'
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

function assertUniqueIds(collection: string, items: Array<{ id: string }>): void {
  const seen = new Set<string>()
  for (const { id } of items) {
    if (seen.has(id)) throw new BadRequestError(`The backup has a duplicate ${collection} id: ${id}`)
    seen.add(id)
  }
}

/**
 * Rejects backups with colliding ids and drops links to records the file doesn't contain.
 * Dangling links are repaired rather than rejected: the app itself can leave them behind
 * (e.g. a deleted transaction stays in a subscription's paymentIds until the next edit).
 */
export function checkedBackupData(data: Backup['data']): Backup['data'] {
  const { config, expenses, recurring, vehicles, subscriptions } = data
  assertUniqueIds('category', config.categories)
  assertUniqueIds('deduction profile', config.deductionProfiles)
  assertUniqueIds('transaction', expenses)
  assertUniqueIds('recurring transaction', recurring)
  assertUniqueIds('vehicle', vehicles)
  assertUniqueIds('subscription', subscriptions)

  const expenseIds = new Set(expenses.map((expense) => expense.id))
  const recurringIds = new Set(recurring.map((template) => template.id))
  const vehicleIds = new Set(vehicles.map((vehicle) => vehicle.id))
  const profileIds = new Set(config.deductionProfiles.map((profile) => profile.id))

  return {
    config: {
      ...config,
      categories: config.categories.map(({ vehicleId, ...category }) =>
        vehicleId && vehicleIds.has(vehicleId) ? { ...category, vehicleId } : category
      ),
    },
    expenses: expenses.map(({ vehicleExpense, ...expense }) =>
      vehicleExpense && !vehicleIds.has(vehicleExpense.vehicleId) ? expense : { ...expense, vehicleExpense }
    ),
    recurring,
    vehicles,
    subscriptions: subscriptions.map(({ recurringId, deductionProfileId, paymentIds, ...subscription }) => ({
      ...subscription,
      ...(recurringId && recurringIds.has(recurringId) ? { recurringId } : {}),
      ...(deductionProfileId && profileIds.has(deductionProfileId) ? { deductionProfileId } : {}),
      ...(paymentIds ? { paymentIds: paymentIds.filter((id) => expenseIds.has(id)) } : {}),
    })),
  }
}

/** Replaces all user data with the backup; the cached exchange rates are kept */
export function restoreBackup(backup: Backup): Promise<RestoreSummary> {
  // validated before the lock and the first write, so a bad file leaves the current data untouched
  const data = checkedBackupData(backup.data)
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
