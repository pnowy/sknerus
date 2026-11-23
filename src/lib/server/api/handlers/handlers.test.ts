import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportBackupHandler, restoreBackupHandler } from '@/lib/server/api/handlers/backup'
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
import {
  bookPaymentHandler,
  createSubscriptionHandler,
  deleteSubscriptionHandler,
  getSubscriptionsHandler,
  importRecurringSubscriptionsHandler,
  skipRenewalHandler,
  updateSubscriptionHandler,
} from '@/lib/server/api/handlers/subscriptions'
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
  getSubscriptions: vi.fn(),
  saveSubscriptions: vi.fn(),
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
  features: { vehicleExpenseTracking: false, subscriptionTracking: true },
  deductionProfiles: [{ id: 'ded_1', name: 'JDG', vatRate: 23, vatRecoverable: 100, incomeTaxRate: 19, extraRate: 0 }],
}

let expenses: Array<Record<string, unknown>>
let recurring: Array<Record<string, unknown>>
let vehicles: Array<Record<string, unknown>>
let subscriptions: Array<Record<string, unknown>>

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
  subscriptions = []
  config.features = { vehicleExpenseTracking: false, subscriptionTracking: true }
  mocks.getSubscriptions.mockImplementation(async () => subscriptions)
  mocks.saveSubscriptions.mockImplementation(async (next) => {
    subscriptions = next
  })
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

  describe('subscriptions', () => {
    const subscriptionInput = {
      name: 'YouTube Premium',
      amount: 26.99,
      currency: 'PLN',
      billingPeriodMonths: 1,
      categoryId: 'cat_food',
      priceIncludesVat: true,
      active: true,
    }
    const youtubeRecurring = {
      id: 'rec_yt',
      name: 'YouTube',
      amount: -25,
      currency: 'PLN',
      categoryId: 'cat_food',
      tags: [],
      frequency: 'monthly',
      dayOfMonth: 5,
      startDate: '2026-01-05',
    }

    describe('when the plugin is disabled', () => {
      it('should respond with 404', async () => {
        config.features = { vehicleExpenseTracking: false, subscriptionTracking: false }
        expect((await getSubscriptionsHandler()).status).toBe(404)
      })
    })

    describe('when creating with a schedule', () => {
      it('should create a linked recurring transaction with a negative amount', async () => {
        const response = await createSubscriptionHandler(
          request('/api/v1/subscriptions', 'POST', { ...subscriptionInput, billingPeriodMonths: 3, schedule: { startDate: '2026-02-10' } })
        )
        const created = await json(response)
        expect(response.status).toBe(201)
        expect(recurring).toHaveLength(1)
        expect(created.recurringId).toBe(recurring[0].id)
        expect(recurring[0]).toMatchObject({ amount: -26.99, frequency: 'monthly', interval: 3, dayOfMonth: 10 })
      })
    })

    describe('when creating with an unknown deduction profile', () => {
      it('should reject the request', async () => {
        const response = await createSubscriptionHandler(
          request('/api/v1/subscriptions', 'POST', { ...subscriptionInput, deductionProfileId: 'ded_missing' })
        )
        expect(response.status).toBe(400)
      })
    })

    describe('when linking a recurring that is already linked', () => {
      it('should reject the second link', async () => {
        recurring = [youtubeRecurring]
        await createSubscriptionHandler(request('/api/v1/subscriptions', 'POST', { ...subscriptionInput, recurringId: 'rec_yt' }))
        const second = await createSubscriptionHandler(
          request('/api/v1/subscriptions', 'POST', { ...subscriptionInput, recurringId: 'rec_yt' })
        )
        expect(second.status).toBe(400)
      })
    })

    describe('when a linked subscription is updated', () => {
      it('should push name and price to the recurring transaction', async () => {
        recurring = [youtubeRecurring]
        const created = await json(
          await createSubscriptionHandler(request('/api/v1/subscriptions', 'POST', { ...subscriptionInput, recurringId: 'rec_yt' }))
        )
        await updateSubscriptionHandler(
          request(`/api/v1/subscriptions/${created.id}`, 'PUT', {
            ...subscriptionInput,
            name: 'YT Premium',
            amount: 30,
            recurringId: 'rec_yt',
          }),
          created.id
        )
        expect(recurring[0]).toMatchObject({ name: 'YT Premium', amount: -30, startDate: '2026-01-05' })
      })
    })

    describe('when a linked recurring is updated', () => {
      it('should mirror the change on the subscription', async () => {
        recurring = [youtubeRecurring]
        await createSubscriptionHandler(request('/api/v1/subscriptions', 'POST', { ...subscriptionInput, recurringId: 'rec_yt' }))
        await updateRecurringHandler(
          request('/api/v1/recurring/rec_yt', 'PUT', { ...youtubeRecurring, amount: -40, frequency: 'yearly', month: 1 }),
          'rec_yt'
        )
        expect(subscriptions[0]).toMatchObject({ amount: 40, billingPeriodMonths: 12, recurringId: 'rec_yt' })
      })

      it('should unlink the subscription when the recurring becomes weekly', async () => {
        recurring = [youtubeRecurring]
        await createSubscriptionHandler(request('/api/v1/subscriptions', 'POST', { ...subscriptionInput, recurringId: 'rec_yt' }))
        await updateRecurringHandler(
          request('/api/v1/recurring/rec_yt', 'PUT', { ...youtubeRecurring, frequency: 'weekly', dayOfWeek: 1 }),
          'rec_yt'
        )
        expect(subscriptions[0].recurringId).toBeUndefined()
      })
    })

    describe('when a linked recurring is deleted', () => {
      it('should keep the subscription but drop the link', async () => {
        recurring = [youtubeRecurring]
        await createSubscriptionHandler(request('/api/v1/subscriptions', 'POST', { ...subscriptionInput, recurringId: 'rec_yt' }))
        await deleteRecurringHandler(new Request('http://localhost/api/v1/recurring/rec_yt'), 'rec_yt')
        expect(subscriptions).toHaveLength(1)
        expect(subscriptions[0].recurringId).toBeUndefined()
      })
    })

    describe('when deleting a subscription with its recurring', () => {
      it('should remove both but keep booked expenses', async () => {
        recurring = [youtubeRecurring]
        expenses = [
          {
            id: 'exp_1',
            name: 'YouTube',
            amount: -25,
            currency: 'PLN',
            categoryId: 'cat_food',
            date: '2026-01-05',
            tags: [],
            recurringId: 'rec_yt',
          },
        ]
        const created = await json(
          await createSubscriptionHandler(request('/api/v1/subscriptions', 'POST', { ...subscriptionInput, recurringId: 'rec_yt' }))
        )
        const response = await deleteSubscriptionHandler(
          new Request(`http://localhost/api/v1/subscriptions/${created.id}?withRecurring=true`),
          created.id
        )
        expect(response.status).toBe(200)
        expect(subscriptions).toHaveLength(0)
        expect(recurring).toHaveLength(0)
        expect(expenses).toHaveLength(1)
      })
    })

    describe('when importing from recurring', () => {
      it('should import convertible, unlinked expenses only', async () => {
        recurring = [
          youtubeRecurring,
          { ...youtubeRecurring, id: 'rec_weekly', frequency: 'weekly', dayOfWeek: 1 },
          { ...youtubeRecurring, id: 'rec_income', amount: 100 },
        ]
        const response = await importRecurringSubscriptionsHandler(
          request('/api/v1/subscriptions/import-recurring', 'POST', {
            recurringIds: ['rec_yt', 'rec_weekly', 'rec_income'],
            deductionProfileId: 'ded_1',
          })
        )
        await expect(json(response)).resolves.toEqual({ created: 1 })
        expect(subscriptions[0]).toMatchObject({ amount: 25, recurringId: 'rec_yt', deductionProfileId: 'ded_1' })

        const again = await importRecurringSubscriptionsHandler(
          request('/api/v1/subscriptions/import-recurring', 'POST', { recurringIds: ['rec_yt'] })
        )
        await expect(json(again)).resolves.toEqual({ created: 0 })
      })
    })

    describe('when manual payments are booked and skipped', () => {
      const orangeFlex = {
        id: 'sub_flex',
        name: 'Orange Flex',
        amount: 300,
        currency: 'PLN',
        billingPeriodMonths: 12,
        categoryId: 'cat_food',
        priceIncludesVat: true,
        active: true,
        nextRenewal: '2027-05-14',
      }

      it('should create the transaction, link it, update the price and move the renewal a period ahead', async () => {
        subscriptions = [orangeFlex]
        const response = await bookPaymentHandler(
          request('/api/v1/subscriptions/sub_flex/book', 'POST', {
            date: '2027-05-15',
            amount: 320,
            categoryId: 'cat_food',
            updatePrice: true,
          }),
          'sub_flex'
        )
        expect(response.status).toBe(201)
        expect(expenses).toHaveLength(1)
        expect(expenses[0]).toMatchObject({ name: 'Orange Flex', amount: -320, currency: 'PLN', date: '2027-05-15' })
        expect(subscriptions[0]).toMatchObject({ amount: 320, nextRenewal: '2028-05-14', paymentIds: [expenses[0].id] })
      })

      it('should convert a foreign-currency payment and keep the original amount', async () => {
        subscriptions = [{ ...orangeFlex, currency: 'USD' }]
        mocks.getExchangeRates.mockResolvedValue([{ date: '2027-05-14', rates: { USD: { PLN: 4 } } }])
        await bookPaymentHandler(
          request('/api/v1/subscriptions/sub_flex/book', 'POST', { date: '2027-05-14', amount: 10, categoryId: 'cat_food' }),
          'sub_flex'
        )
        expect(expenses[0]).toMatchObject({ amount: -40, currency: 'PLN', originalAmount: -10, originalCurrency: 'USD' })
        expect(subscriptions[0]).toMatchObject({ amount: 300 })
      })

      it('should reject booking for a subscription paid by a recurring transaction', async () => {
        subscriptions = [{ ...orangeFlex, recurringId: 'rec_yt' }]
        const response = await bookPaymentHandler(
          request('/api/v1/subscriptions/sub_flex/book', 'POST', { date: '2027-05-14', amount: 300, categoryId: 'cat_food' }),
          'sub_flex'
        )
        expect(response.status).toBe(400)
        expect(expenses).toHaveLength(0)
      })

      it('should move the renewal a period ahead without booking on skip', async () => {
        subscriptions = [orangeFlex]
        const response = await skipRenewalHandler(request('/api/v1/subscriptions/sub_flex/skip', 'POST'), 'sub_flex')
        expect(response.status).toBe(200)
        expect(subscriptions[0]).toMatchObject({ nextRenewal: '2028-05-14' })
        expect(expenses).toHaveLength(0)
      })
    })

    describe('when payments are linked on update', () => {
      const payment = { id: 'exp_may', name: 'Orange', amount: -300, currency: 'PLN', categoryId: 'cat_food', date: '2026-05-14', tags: [] }

      it('should drop ids of deleted transactions', async () => {
        expenses = [payment]
        const created = await json(await createSubscriptionHandler(request('/api/v1/subscriptions', 'POST', subscriptionInput)))
        await updateSubscriptionHandler(
          request(`/api/v1/subscriptions/${created.id}`, 'PUT', { ...subscriptionInput, paymentIds: ['exp_may', 'exp_gone'] }),
          created.id
        )
        expect(subscriptions[0]).toMatchObject({ paymentIds: ['exp_may'] })
      })

      it('should reject a transaction already linked to another subscription', async () => {
        expenses = [payment]
        await createSubscriptionHandler(request('/api/v1/subscriptions', 'POST', { ...subscriptionInput, paymentIds: ['exp_may'] }))
        const second = await createSubscriptionHandler(
          request('/api/v1/subscriptions', 'POST', { ...subscriptionInput, paymentIds: ['exp_may'] })
        )
        expect(second.status).toBe(400)
      })
    })
  })

  describe('backup', () => {
    const transaction = { id: 'exp_1', name: 'Bread', amount: -4, currency: 'PLN', categoryId: 'cat_food', date: '2026-01-03', tags: [] }

    describe('when exporting', () => {
      it('should include every collection and leave out the exchange-rate API key', async () => {
        expenses = [transaction]
        subscriptions = [
          { id: 'sub_1', name: 'Netflix', amount: 60, currency: 'PLN', billingPeriodMonths: 1, priceIncludesVat: true, active: true },
        ]
        const response = await exportBackupHandler()
        const backup = await json(response)
        expect(response.headers.get('Content-Disposition')).toContain('attachment')
        expect(backup).toMatchObject({ app: 'sknerus', version: 1 })
        expect(backup.data.expenses).toEqual([transaction])
        expect(backup.data.subscriptions).toHaveLength(1)
        expect(backup.data.config.exchangeApiKey).toBeUndefined()
      })
    })

    describe('when restoring an exported backup', () => {
      it('should replace all data and keep the current API key', async () => {
        expenses = [transaction]
        const backup = await json(await exportBackupHandler())
        expenses = [{ ...transaction, id: 'exp_other' }]
        recurring = [{ id: 'rec_gone' }]

        const response = await restoreBackupHandler(request('/api/v1/backup', 'POST', backup))
        expect(response.status).toBe(200)
        expect(expenses).toEqual([transaction])
        expect(recurring).toEqual([])
        expect(config.exchangeApiKey).toBe('secret-api-key')
      })
    })

    describe('when the backup has duplicate ids', () => {
      it('should reject it without touching the data', async () => {
        expenses = [transaction]
        const backup = await json(await exportBackupHandler())
        backup.data.expenses = [transaction, { ...transaction, name: 'Milk' }]
        const response = await restoreBackupHandler(request('/api/v1/backup', 'POST', backup))
        expect(response.status).toBe(400)
        expect(expenses).toEqual([transaction])
      })
    })

    describe('when the backup links to records it does not contain', () => {
      it('should restore it with the dangling links dropped', async () => {
        expenses = [transaction]
        const backup = await json(await exportBackupHandler())
        backup.data.subscriptions = [
          {
            id: 'sub_1',
            name: 'Domain',
            amount: 18,
            currency: 'PLN',
            billingPeriodMonths: 12,
            priceIncludesVat: true,
            active: true,
            recurringId: 'rec_missing',
            deductionProfileId: 'ded_missing',
            paymentIds: ['exp_1', 'exp_deleted'],
          },
        ]
        const response = await restoreBackupHandler(request('/api/v1/backup', 'POST', backup))
        expect(response.status).toBe(200)
        expect(subscriptions[0]).toMatchObject({ paymentIds: ['exp_1'] })
        expect(subscriptions[0]).not.toHaveProperty('recurringId')
        expect(subscriptions[0]).not.toHaveProperty('deductionProfileId')
      })
    })

    describe('when the file is not a backup', () => {
      it('should reject it without touching the data', async () => {
        expenses = [transaction]
        const response = await restoreBackupHandler(request('/api/v1/backup', 'POST', { expenses: [] }))
        expect(response.status).toBe(400)
        expect(expenses).toEqual([transaction])
      })
    })
  })
})
