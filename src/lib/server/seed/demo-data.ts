import { genCategoryId, genExpenseId } from '@/lib/server/ids.server'
import type { Category, Config, Expense } from '@/lib/shared/types/expense'

const SEED_START = { year: 2023, month: 1 }
const now = new Date()
const SEED_END = { year: now.getFullYear(), month: now.getMonth() + 1 }

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function date(year: number, month: number, day: number): string {
  const maxDay = new Date(year, month, 0).getDate()
  return `${year}-${pad(month)}-${pad(Math.min(day, maxDay))}`
}

function rand(min: number, max: number): number {
  return Number((Math.random() * (max - min) + min).toFixed(2))
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateDemoData(): { config: Config; expenses: Array<Expense> } {
  const cats = {
    salary: { id: genCategoryId(), name: 'Salary', color: '#22c55e' },
    groceries: { id: genCategoryId(), name: 'Groceries', color: '#84cc16' },
    housing: { id: genCategoryId(), name: 'Housing', color: '#3b82f6' },
    utilities: { id: genCategoryId(), name: 'Utilities', color: '#f97316' },
    transport: { id: genCategoryId(), name: 'Transport', color: '#a855f7' },
    health: { id: genCategoryId(), name: 'Health', color: '#ef4444' },
    entertainment: { id: genCategoryId(), name: 'Entertainment', color: '#06b6d4' },
    kids: { id: genCategoryId(), name: 'Kids', color: '#eab308' },
    diningOut: { id: genCategoryId(), name: 'Dining Out', color: '#f43f5e' },
    clothing: { id: genCategoryId(), name: 'Clothing', color: '#ec4899' },
    education: { id: genCategoryId(), name: 'Education', color: '#6366f1' },
    subscriptions: { id: genCategoryId(), name: 'Subscriptions', color: '#64748b' },
  } as const satisfies Record<string, Category>

  const categories = Object.values(cats)

  const expenses: Array<Expense> = []

  const push = (name: string, amount: number, catId: string, year: number, month: number, day: number, tags: Array<string> = []): void => {
    expenses.push({
      id: genExpenseId(),
      name,
      amount,
      currency: 'USD',
      categoryId: catId,
      date: date(year, month, day),
      tags,
    })
  }

  let primarySalary = 5800
  let secondarySalary = 3200

  for (let year = SEED_START.year; year <= SEED_END.year; year++) {
    const lastMonth = year === SEED_END.year ? SEED_END.month : 12

    if (year > SEED_START.year) {
      primarySalary = Number((primarySalary * (1 + rand(0.03, 0.05))).toFixed(2))
      secondarySalary = Number((secondarySalary * (1 + rand(0.02, 0.04))).toFixed(2))
    }

    for (let month = 1; month <= lastMonth; month++) {
      const isWinter = month <= 2 || month === 12
      const isSummer = month >= 6 && month <= 8

      // Income
      push('Monthly Salary', rand(primarySalary * 0.95, primarySalary * 1.05), cats.salary.id, year, month, 1)
      // Secondary salary starts March 2023 (career change)
      if (!(year === 2023 && month <= 2)) {
        push('Partner Salary', rand(secondarySalary * 0.95, secondarySalary * 1.05), cats.salary.id, year, month, 5)
      }
      if (month === 12) {
        push('Annual Bonus', rand(4000, 8000), cats.salary.id, year, month, randInt(10, 20))
      }
      if (Math.random() > 0.85) {
        push('Freelance Income', rand(300, 900), cats.salary.id, year, month, randInt(5, 25))
      }

      // Housing
      push('Rent', -1750, cats.housing.id, year, month, 1)
      if (month === 3) {
        push('Home Insurance', -rand(700, 1100), cats.housing.id, year, month, randInt(5, 15))
      }
      if (Math.random() > 0.72) {
        push('Home Maintenance', -rand(50, 380), cats.housing.id, year, month, randInt(5, 25))
      }

      // Utilities
      const electricGas = isWinter ? rand(200, 320) : isSummer ? rand(90, 150) : rand(130, 200)
      push('Electricity & Gas', -electricGas, cats.utilities.id, year, month, randInt(10, 15))
      push('Water', -rand(35, 60), cats.utilities.id, year, month, randInt(8, 12))

      // Subscriptions (fixed monthly)
      push('Internet', -59.99, cats.subscriptions.id, year, month, 5)
      push('Phone Plan', -rand(45, 80), cats.subscriptions.id, year, month, randInt(5, 10))
      push('Netflix', -15.99, cats.subscriptions.id, year, month, 15)
      push('Spotify', -10.99, cats.subscriptions.id, year, month, 20)

      // Groceries: 3-4 trips/month
      const groceryDays = [4, 11, 18, 25]
      const trips = randInt(3, 4)
      for (let i = 0; i < trips; i++) {
        push('Grocery Shopping', -rand(130, 240), cats.groceries.id, year, month, groceryDays[i])
      }
      if (month === 12) {
        push('Holiday Groceries', -rand(200, 380), cats.groceries.id, year, month, randInt(22, 24), ['holiday'])
      }

      // Transport
      push('Gas Station', -rand(55, 110), cats.transport.id, year, month, randInt(3, 8))
      push('Gas Station', -rand(55, 110), cats.transport.id, year, month, randInt(15, 22))
      if (Math.random() > 0.6) {
        push('Parking', -rand(10, 30), cats.transport.id, year, month, randInt(5, 25))
      }
      if (month === 1) {
        push('Car Insurance', -rand(1100, 1500), cats.transport.id, year, month, 10)
      }
      if (month % 3 === 0 && Math.random() > 0.5) {
        push('Car Service', -rand(80, 350), cats.transport.id, year, month, randInt(5, 20))
      }

      // Health
      push('Gym Membership', -45, cats.health.id, year, month, 1)
      if (Math.random() > 0.3) {
        push('Pharmacy', -rand(20, 70), cats.health.id, year, month, randInt(5, 25))
      }
      if (Math.random() > 0.6) {
        push('Doctor Visit', -rand(100, 220), cats.health.id, year, month, randInt(5, 25))
      }
      if (Math.random() > 0.8) {
        push('Dental', -rand(80, 350), cats.health.id, year, month, randInt(5, 25))
      }

      // Entertainment
      if (Math.random() > 0.4) {
        push('Cinema', -rand(20, 55), cats.entertainment.id, year, month, randInt(5, 25))
      }
      if (Math.random() > 0.5) {
        push('Event / Show', -rand(40, 150), cats.entertainment.id, year, month, randInt(5, 25))
      }
      // Summer vacation (July)
      if (month === 7) {
        push('Summer Vacation', -rand(2000, 4200), cats.entertainment.id, year, month, randInt(10, 25), ['vacation'])
      }
      // Christmas
      if (month === 12) {
        push('Christmas Gifts', -rand(300, 700), cats.entertainment.id, year, month, randInt(10, 20), ['holiday'])
      }

      // Dining out: 2-4 times
      const diningTrips = randInt(2, 4)
      for (let i = 0; i < diningTrips; i++) {
        push('Restaurant', -rand(35, 110), cats.diningOut.id, year, month, randInt(1, 28))
      }

      // Kids
      push('School Lunch', -rand(60, 90), cats.kids.id, year, month, randInt(1, 5))
      if (Math.random() > 0.4) {
        push('Kids Activities', -rand(40, 110), cats.kids.id, year, month, randInt(5, 25))
      }
      if (month === 8 || month === 9) {
        push('School Supplies', -rand(100, 280), cats.kids.id, year, month, randInt(15, 25))
      }
      if (month === 12) {
        push('Kids Gifts', -rand(150, 350), cats.kids.id, year, month, randInt(10, 20), ['holiday'])
      }

      // Clothing (peaks in spring & autumn)
      if (month === 3 || month === 9) {
        push('Clothing', -rand(120, 320), cats.clothing.id, year, month, randInt(5, 25))
      } else if (Math.random() > 0.75) {
        push('Clothing', -rand(30, 90), cats.clothing.id, year, month, randInt(5, 25))
      }

      // Education
      if (Math.random() > 0.7) {
        push('Books', -rand(15, 55), cats.education.id, year, month, randInt(5, 25))
      }
      if (Math.random() > 0.75) {
        push('Online Course', -rand(30, 200), cats.education.id, year, month, randInt(5, 25))
      }
    }
  }

  return {
    config: {
      categories,
      currency: 'USD',
      startDate: 1,
      supportedCurrencies: [],
      startPage: 'dashboard',
      exchangeProvider: 'frankfurter',
    },
    expenses,
  }
}
