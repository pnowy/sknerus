import { logger } from '@/lib/logging'
import type { StorageAdapter } from '@/lib/server/storage/types'
import { generateDemoData } from './demo-data'

const log = logger.named('seed')

export async function seedIfFirstRun(storage: StorageAdapter): Promise<void> {
  if (process.env.SEED_DEMO_DATA !== 'true') return

  const [config, expenses] = await Promise.all([storage.getConfig(), storage.getExpenses()])

  if (config.categories.length > 0 || expenses.length > 0) {
    log.info('Skipping demo data seed — existing data found')
    return
  }

  log.info('Seeding demo data...')
  const { config: demoConfig, expenses: demoExpenses, vehicles: demoVehicles } = generateDemoData()

  await Promise.all([storage.saveConfig(demoConfig), storage.saveExpenses(demoExpenses), storage.saveVehicles(demoVehicles)])

  log.info(`Demo data seeded`, {
    expenses: demoExpenses.length,
    categories: demoConfig.categories.length,
    vehicles: demoVehicles.length,
  })
}
