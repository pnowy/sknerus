// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExpenseFormDialog } from '@/components/expense-form-dialog'
import type { Category } from '@/lib/shared/types/expense'

vi.mock('@/hooks/use-expenses', () => ({
  useConfig: () => ({ data: { showTags: true, showNotes: true } }),
  useCreateExpense: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUpdateExpense: () => ({ isPending: false, mutateAsync: vi.fn() }),
}))

vi.mock('@/lib/server/functions/exchange-rates', () => ({
  resolveExchangeRate: vi.fn(),
}))

afterEach(cleanup)

const categories: Array<Category> = [
  { id: 'groceries', name: 'Groceries', color: '#000' },
  { id: 'salary', name: 'Salary', color: '#000', isIncome: true },
  { id: 'electricity', name: 'Electricity', color: '#000' },
]

const trigger = () => screen.getByRole('combobox')
const incomeSwitch = () => screen.getByRole('switch')

async function selectCategory(name: string) {
  fireEvent.click(trigger())
  const option = await screen.findByRole('option', { name })
  fireEvent.pointerDown(option)
  fireEvent.click(option)
  await waitFor(() => expect(trigger().textContent).toContain(name))
}

function renderDialog() {
  render(<ExpenseFormDialog open onClose={vi.fn()} categories={categories} currency="PLN" supportedCurrencies={[]} allTags={[]} />)
}

describe('ExpenseFormDialog', () => {
  it('should show the first expense category by default', () => {
    renderDialog()
    expect(screen.getByRole('combobox', { name: '' }).textContent).toContain('Groceries')
  })

  it('should keep the category when toggling income manually', async () => {
    renderDialog()
    fireEvent.click(incomeSwitch())
    await waitFor(() => expect(incomeSwitch().getAttribute('aria-checked')).toBe('true'))
    await new Promise((r) => setTimeout(r, 50))
    expect(trigger().textContent).toContain('Groceries')
  })

  it('should list all categories regardless of the income switch', async () => {
    renderDialog()
    fireEvent.click(incomeSwitch())
    fireEvent.click(trigger())
    expect(await screen.findByRole('option', { name: 'Groceries' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Salary' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Electricity' })).toBeTruthy()
  })

  it('should preset income when picking an income category and allow overriding it', async () => {
    renderDialog()
    await selectCategory('Salary')
    expect(incomeSwitch().getAttribute('aria-checked')).toBe('true')
    fireEvent.click(incomeSwitch())
    await waitFor(() => expect(incomeSwitch().getAttribute('aria-checked')).toBe('false'))
    expect(trigger().textContent).toContain('Salary')
  })

  it('should keep a manual income switch for mixed categories', async () => {
    renderDialog()
    fireEvent.click(incomeSwitch())
    await selectCategory('Electricity')
    expect(incomeSwitch().getAttribute('aria-checked')).toBe('true')
  })
})
