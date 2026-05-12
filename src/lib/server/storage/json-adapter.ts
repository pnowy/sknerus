import * as fs from 'node:fs'
import * as path from 'node:path'
import { genCategoryId } from '@/lib/server/ids.server'
import type { Config, ExchangeRate, Expense, RecurringExpense } from '@/lib/shared/types/expense'
import type { StorageAdapter } from './types'

const DEFAULT_CONFIG: Config = {
  categories: [],
  currency: 'USD',
  startDate: 1,
  supportedCurrencies: [],
  startPage: 'dashboard',
  exchangeProvider: 'frankfurter',
}

export class JsonAdapter implements StorageAdapter {
  private readonly dataDir: string
  private readonly expensesFile: string
  private readonly configFile: string
  private readonly recurringFile: string
  private readonly exchangeRatesFile: string

  constructor(dataDir?: string) {
    this.dataDir = path.resolve(process.cwd(), dataDir ?? process.env.DATA_DIR ?? '.data')
    this.expensesFile = path.join(this.dataDir, 'expenses.json')
    this.configFile = path.join(this.dataDir, 'config.json')
    this.recurringFile = path.join(this.dataDir, 'recurring.json')
    this.exchangeRatesFile = path.join(this.dataDir, 'exchange-rates.json')
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
      supportedCurrencies: stored.supportedCurrencies ?? [],
      startPage: stored.startPage ?? DEFAULT_CONFIG.startPage,
      exchangeProvider: stored.exchangeProvider ?? DEFAULT_CONFIG.exchangeProvider,
      exchangeApiKey: stored.exchangeApiKey,
    }

    if (needsWrite) await this.saveConfig(config)
    return config
  }

  async saveConfig(config: Config): Promise<void> {
    this.ensureDataDir()
    fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2))
  }

  async getRecurring(): Promise<Array<RecurringExpense>> {
    this.ensureDataDir()
    if (!fs.existsSync(this.recurringFile)) return []
    return JSON.parse(fs.readFileSync(this.recurringFile, 'utf-8')) as Array<RecurringExpense>
  }

  async saveRecurring(recurring: Array<RecurringExpense>): Promise<void> {
    this.ensureDataDir()
    fs.writeFileSync(this.recurringFile, JSON.stringify(recurring, null, 2))
  }

  async getExchangeRates(): Promise<Array<ExchangeRate>> {
    this.ensureDataDir()
    if (!fs.existsSync(this.exchangeRatesFile)) return []
    return JSON.parse(fs.readFileSync(this.exchangeRatesFile, 'utf-8')) as Array<ExchangeRate>
  }

  async saveExchangeRates(rates: Array<ExchangeRate>): Promise<void> {
    this.ensureDataDir()
    fs.writeFileSync(this.exchangeRatesFile, JSON.stringify(rates, null, 2))
  }
}
