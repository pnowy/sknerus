import Papa from 'papaparse'
import { ulid } from 'ulid'
import { randomColor } from '@/lib/utils'
import type { Category, Expense } from './types/expense'

export function exportToCSV(expenses: Array<Expense>, categories: Array<Category>): void {
  const catMap = new Map(categories.map((c) => [c.id, c.name]))
  const header = 'id,name,amount,currency,category,date,tags'
  const rows = expenses.map((e) =>
    [e.id, e.name, e.amount, e.currency, catMap.get(e.categoryId) ?? e.categoryId, e.date, e.tags.join(';')].join(',')
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export type ParsedCSV = {
  expenses: Array<Omit<Expense, 'id'>>
  newCategories: Array<Category>
}

export function parseCSV(csv: string, categories: Array<Category>, defaultCurrency: string): ParsedCSV {
  const nameToId = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]))
  const newCategories: Array<Category> = []

  function resolveCategoryId(name: string): string {
    const key = name.toLowerCase()
    const existing = nameToId.get(key)
    if (existing) return existing
    const id = `cat_${ulid()}`
    const newCat: Category = { id, name, color: randomColor() }
    newCategories.push(newCat)
    nameToId.set(key, id)
    return id
  }

  type CsvRow = { name?: string; amount?: string; category?: string; date?: string; tags?: string }

  const { data } = Papa.parse<CsvRow>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  })

  const expenses = data.map((row) => {
    const tagsRaw = row.tags ?? ''
    return {
      name: row.name ?? '',
      amount: Number(row.amount || 0),
      currency: defaultCurrency,
      categoryId: resolveCategoryId(row.category ?? ''),
      date: (row.date ?? '').slice(0, 10),
      tags: tagsRaw ? tagsRaw.split(';').filter(Boolean) : [],
    }
  })

  return { expenses, newCategories }
}
