import type { Expense } from './types/expense'

export function exportToCSV(expenses: Array<Expense>): void {
  const header = 'id,name,amount,currency,category,date,tags'
  const rows = expenses.map((e) => [e.id, e.name, e.amount, e.currency, e.category, e.date, e.tags.join(';')].join(','))
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseCSV(csv: string): Array<Omit<Expense, 'id'>> {
  const lines = csv.trim().split('\n').slice(1)
  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.split(',')
      const [, name, amount, currency, category, date, tags] = parts
      return {
        name: name ?? '',
        amount: Number(amount ?? 0),
        currency: currency ?? 'USD',
        category: category ?? '',
        date: date ?? '',
        tags: tags ? tags.split(';').filter(Boolean) : [],
      }
    })
}
