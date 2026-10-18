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
]

function renderDialog() {
  render(<ExpenseFormDialog open onClose={vi.fn()} categories={categories} currency="PLN" supportedCurrencies={[]} allTags={[]} />)
}

describe('ExpenseFormDialog', () => {
  it('should show the first expense category by default', () => {
    renderDialog()
    expect(screen.getByRole('combobox', { name: '' }).textContent).toContain('Groceries')
  })

  it('should show the income category after switching to income', async () => {
    renderDialog()
    fireEvent.click(screen.getByRole('switch'))
    await waitFor(() => expect(screen.getByText('Salary')).toBeTruthy())
    expect(screen.queryByText('Groceries')).toBeNull()
  })

  it('should keep the income category visible after the select was focused', async () => {
    renderDialog()
    const trigger = () => screen.getByRole('combobox')
    fireEvent.focus(trigger())
    await waitFor(() => expect(screen.getAllByRole('option', { hidden: true }).length).toBeGreaterThan(0))
    fireEvent.click(screen.getByRole('switch'))
    await waitFor(() => expect(trigger().textContent).toContain('Salary'))
    await new Promise((r) => setTimeout(r, 50))
    expect(trigger().textContent).toContain('Salary')
    fireEvent.click(screen.getByRole('switch'))
    await new Promise((r) => setTimeout(r, 50))
    expect(trigger().textContent).toContain('Groceries')
  })
})
