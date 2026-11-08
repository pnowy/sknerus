import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getCategoriesHandler, getConfigHandler, renameCategoryHandler, updateConfigHandler } from '@/lib/server/api/handlers/config'
import {
  createExpenseHandler,
  deleteExpenseHandler,
  getExpenseHandler,
  getExpensesHandler,
  patchExpenseHandler,
  replaceExpenseHandler,
} from '@/lib/server/api/handlers/expenses'
import {
  createRecurringHandler,
  deleteRecurringHandler,
  getRecurringHandler,
  updateRecurringHandler,
} from '@/lib/server/api/handlers/recurring'
import { createVehicleHandler, deleteVehicleHandler, getVehiclesHandler, updateVehicleHandler } from '@/lib/server/api/handlers/vehicles'

const mocks = vi.hoisted(() => ({
  getExpenses: vi.fn(),
  saveExpenses: vi.fn(),
  getConfig: vi.fn(),
  saveConfig: vi.fn(),
  getRecurring: vi.fn(),
  saveRecurring: vi.fn(),
  getVehicles: vi.fn(),
  saveVehicles: vi.fn(),
  getExchangeRates: vi.fn(),
  saveExchangeRates: vi.fn(),
}))

vi.mock('@/lib/server/storage', () => ({ storage: mocks }))

const config = {
  categories: [{ id: 'cat_food', name: 'Food', color: '#ffffff' }],
  currency: 'PLN',
  startDate: 1,
  supportedCurrencies: [],
  startPage: 'dashboard',
  exchangeProvider: 'frankfurter',
  exchangeApiKey: 'secret-api-key',
  showTags: true,
  showNotes: true,
  showSearch: false,
  fabPosition: 'right',
  features: { vehicleExpenseTracking: false },
}

let expenses: Array<Record<string, unknown>>
let recurring: Array<Record<string, unknown>>
let vehicles: Array<Record<string, unknown>>

function request(path: string, method = 'GET', body?: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

async function json(response: Response) {
  return response.json()
}

beforeEach(() => {
  expenses = []
  recurring = []
  vehicles = []
  mocks.getExpenses.mockImplementation(async () => expenses)
  mocks.saveExpenses.mockImplementation(async (nextExpenses) => {
    expenses = nextExpenses
  })
  mocks.getConfig.mockResolvedValue(config)
  mocks.saveConfig.mockImplementation(async (nextConfig) => {
    Object.assign(config, nextConfig)
  })
  mocks.getRecurring.mockImplementation(async () => recurring)
  mocks.saveRecurring.mockImplementation(async (nextRecurring) => {
    recurring = nextRecurring
  })
  mocks.getVehicles.mockImplementation(async () => vehicles)
  mocks.saveVehicles.mockImplementation(async (nextVehicles) => {
    vehicles = nextVehicles
  })
  mocks.getExchangeRates.mockResolvedValue([])
  mocks.saveExchangeRates.mockResolvedValue(undefined)
})

afterEach(() => vi.resetAllMocks())

describe('REST route handlers', () => {
  it('lists filtered expenses and creates with configured currency and default tags', async () => {
    expenses = [
      { id: 'exp_1', name: 'Bread', amount: -4, currency: 'PLN', categoryId: 'cat_food', date: '2026-01-03', tags: ['market'] },
      { id: 'exp_2', name: 'Milk', amount: -3, currency: 'PLN', categoryId: 'cat_food', date: '2026-01-08', tags: ['market'] },
    ]
    const listed = await getExpensesHandler(request('/api/v1/expenses?from=2026-01-04&tag=market'))
    const created = await createExpenseHandler(
      request('/api/v1/expenses', 'POST', { name: 'Groceries', amount: -20, categoryId: 'cat_food', date: '2026-01-05' })
    )

    await expect(json(listed)).resolves.toEqual([expenses[1]])
    expect(created.status).toBe(201)
    await expect(json(created)).resolves.toMatchObject({ currency: 'PLN', tags: [] })
  })

  it('reports invalid JSON, invalid expense input, unknown categories, and missing expenses', async () => {
    const invalidJson = await createExpenseHandler(new Request('http://localhost/api/v1/expenses', { method: 'POST', body: '{' }))
    const invalid = await createExpenseHandler(request('/api/v1/expenses', 'POST', { name: '', amount: 0 }))
    const unknownCategory = await createExpenseHandler(
      request('/api/v1/expenses', 'POST', { name: 'Unknown', amount: -1, categoryId: 'missing', date: '2026-01-01' })
    )
    const missingGet = await getExpenseHandler('missing')
    const missingPatch = await patchExpenseHandler(request('/api/v1/expenses/missing', 'PATCH', { amount: -3 }), 'missing')
    const missingPut = await replaceExpenseHandler(request('/api/v1/expenses/missing', 'PUT', {}), 'missing')
    const missingDelete = await deleteExpenseHandler('missing')

    expect([invalidJson.status, invalid.status, unknownCategory.status]).toEqual([400, 400, 400])
    expect([missingGet.status, missingPatch.status, missingPut.status, missingDelete.status]).toEqual([404, 404, 404, 404])
  })

  it('merges expense patches and supports replacement and deletion', async () => {
    expenses = [
      {
        id: 'exp_existing',
        name: 'Groceries',
        amount: -20,
        currency: 'PLN',
        categoryId: 'cat_food',
        date: '2026-01-05',
        tags: ['market'],
        notes: 'weekly shop',
      },
    ]
    const patched = await patchExpenseHandler(request('/api/v1/expenses/exp_existing', 'PATCH', { amount: -25 }), 'exp_existing')
    await expect(json(patched)).resolves.toMatchObject({ amount: -25, tags: ['market'], notes: 'weekly shop' })
    const replaced = await replaceExpenseHandler(
      request('/api/v1/expenses/exp_existing', 'PUT', {
        name: 'Market',
        amount: -12,
        currency: 'PLN',
        categoryId: 'cat_food',
        date: '2026-01-06',
        tags: [],
      }),
      'exp_existing'
    )
    await expect(json(replaced)).resolves.toMatchObject({ name: 'Market', amount: -12 })
    expect((await deleteExpenseHandler('exp_existing')).status).toBe(200)
    expect(expenses).toHaveLength(0)
  })

  it('serves and updates configuration and categories', async () => {
    const configResponse = await getConfigHandler()
    const categoriesResponse = await getCategoriesHandler()
    expect((await json(configResponse)).exchangeApiKey).toBe('secret-api-key')
    await expect(json(categoriesResponse)).resolves.toEqual(config.categories)

    const renamed = await renameCategoryHandler(request('/api/v1/categories/cat_food/rename', 'POST', { newName: 'Groceries' }), 'cat_food')
    await expect(json(renamed)).resolves.toEqual({ ok: true })
    const updated = await updateConfigHandler(request('/api/v1/config', 'PUT', config))
    expect(updated.status).toBe(200)
  })

  it('supports recurring and vehicle collection and item operations', async () => {
    const recurringInput = {
      name: 'Monthly groceries',
      amount: -10,
      currency: 'PLN',
      categoryId: 'cat_food',
      tags: [],
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: '2026-01-01',
    }
    const recurringCreate = await createRecurringHandler(request('/api/v1/recurring', 'POST', recurringInput))
    const createdRecurring = await json(recurringCreate)
    expect(recurringCreate.status).toBe(201)
    await expect(getRecurringHandler()).resolves.toHaveProperty('status', 200)
    expect((await updateRecurringHandler(request('/api/v1/recurring/item', 'PUT', recurringInput), createdRecurring.id)).status).toBe(200)
    expect((await deleteRecurringHandler(new Request('http://localhost/api/v1/recurring/item'), createdRecurring.id)).status).toBe(200)

    const vehicleInput = {
      name: 'Car',
      type: 'car',
      odometerAtRegistration: 0,
      yearOfProduction: 2020,
      engineSize: 1600,
      fuelTankSize: 50,
      fuelType: 'gasoline',
    }
    const vehicleCreate = await createVehicleHandler(request('/api/v1/vehicles', 'POST', vehicleInput))
    const createdVehicle = await json(vehicleCreate)
    expect(vehicleCreate.status).toBe(201)
    await expect(getVehiclesHandler()).resolves.toHaveProperty('status', 200)
    expect((await updateVehicleHandler(request('/api/v1/vehicles/item', 'PUT', vehicleInput), createdVehicle.id)).status).toBe(200)
    expect((await deleteVehicleHandler(new Request('http://localhost/api/v1/vehicles/item'), createdVehicle.id)).status).toBe(200)
  })
})
