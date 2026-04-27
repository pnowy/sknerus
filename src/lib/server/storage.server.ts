import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Config, Expense } from '../shared/types/expense'
import { genCategoryId } from './ids.server'

const DATA_DIR = path.resolve(process.cwd(), process.env.DATA_DIR ?? '.data')
const EXPENSES_FILE = path.join(DATA_DIR, 'expenses.json')
const CONFIG_FILE = path.join(DATA_DIR, 'config.json')

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

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

export function readExpenses(): Array<Expense> {
  ensureDataDir()
  if (!fs.existsSync(EXPENSES_FILE)) return []
  const raw = JSON.parse(fs.readFileSync(EXPENSES_FILE, 'utf-8')) as Array<Expense> | { expenses: Array<Expense> }
  return Array.isArray(raw) ? raw : raw.expenses
}

export function writeExpenses(expenses: Array<Expense>): void {
  ensureDataDir()
  fs.writeFileSync(EXPENSES_FILE, JSON.stringify(expenses, null, 2))
}

export function readConfig(): Config {
  ensureDataDir()
  const stored = fs.existsSync(CONFIG_FILE)
    ? (JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) as Partial<
        Config & { categories: Array<{ id?: string; name: string; color: string }> }
      >)
    : {}

  // Migrate old categories that lack an id
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

  if (needsWrite) writeConfig(config)
  return config
}

export function writeConfig(config: Config): void {
  ensureDataDir()
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}
