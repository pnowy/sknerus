import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Config, Expense } from '../../shared/types/expense'
import { genCategoryId } from '../ids.server'
import type { StorageAdapter } from './types'

const DEFAULT_CONFIG: Config = {
  categories: [
    { id: genCategoryId(), name: 'Food', color: '#FF6B6B' },
    { id: genCategoryId(), name: 'Transport', color: '#4ECDC4' },
    { id: genCategoryId(), name: 'Housing', color: '#45B7D1' },
    { id: genCategoryId(), name: 'Entertainment', color: '#96CEB4' },
    { id: genCategoryId(), name: 'Health', color: '#FFBE0B' },
    { id: genCategoryId(), name: 'Other', color: '#FF006E' },
  ],
  currency: 'USD',
  startDate: 1,
}

export class JsonAdapter implements StorageAdapter {
  private readonly dataDir: string
  private readonly expensesFile: string
  private readonly configFile: string

  constructor(dataDir?: string) {
    this.dataDir = path.resolve(process.cwd(), dataDir ?? process.env.DATA_DIR ?? '.data')
    this.expensesFile = path.join(this.dataDir, 'expenses.json')
    this.configFile = path.join(this.dataDir, 'config.json')
  }

  private ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true })
  }

  async getExpenses(): Promise<Array<Expense>> {
    this.ensureDataDir()
    if (!fs.existsSync(this.expensesFile)) return []
    const raw = JSON.parse(fs.readFileSync(this.expensesFile, 'utf-8')) as Array<Expense> | { expenses: Array<Expense> }
    return Array.isArray(raw) ? raw : raw.expenses
  }

  async saveExpenses(expenses: Array<Expense>): Promise<void> {
    this.ensureDataDir()
    fs.writeFileSync(this.expensesFile, JSON.stringify(expenses, null, 2))
  }

  async getConfig(): Promise<Config> {
    this.ensureDataDir()
    const stored = fs.existsSync(this.configFile)
      ? (JSON.parse(fs.readFileSync(this.configFile, 'utf-8')) as Partial<
          Config & { categories: Array<{ id?: string; name: string; color: string }> }
        >)
      : {}

    const rawCategories = stored.categories ?? DEFAULT_CONFIG.categories
    let needsWrite = false
    const categories = rawCategories.map((c) => {
      if (!c.id) {
        needsWrite = true
        return { ...c, id: genCategoryId() }
      }
      return c as Config['categories'][number]
    })

    const config: Config = {
      categories,
      currency: (stored.currency ?? DEFAULT_CONFIG.currency).toUpperCase(),
      startDate: stored.startDate ?? DEFAULT_CONFIG.startDate,
    }

    if (needsWrite) await this.saveConfig(config)
    return config
  }

  async saveConfig(config: Config): Promise<void> {
    this.ensureDataDir()
    fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2))
  }
}
