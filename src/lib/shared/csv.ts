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

export function parseCSV(csv: string, categories: Array<Category>): ParsedCSV {
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

  const lines = csv.trim().split('\n').slice(1)
  const expenses = lines
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.split(',')
      const [, name, amount, currency, category, date, tags] = parts
      return {
        name: name ?? '',
        amount: Number(amount ?? 0),
        currency: currency ?? 'USD',
        categoryId: resolveCategoryId(category ?? ''),
        date: date ?? '',
        tags: tags ? tags.split(';').filter(Boolean) : [],
      }
    })

  return { expenses, newCategories }
}
