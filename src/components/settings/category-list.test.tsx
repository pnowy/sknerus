// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CategoryList } from '@/components/settings/category-list'
import type { Category, Expense } from '@/lib/shared/types/expense'

afterEach(cleanup)

const categories: Array<Category> = [{ id: 'groceries', name: 'Groceries', color: '#000' }]

function renderList() {
  const onChange = vi.fn()
  render(<CategoryList categories={categories} currency="PLN" onChange={onChange} onNameChange={vi.fn()} />)
  return onChange
}

function addCategory(name: string) {
  fireEvent.change(screen.getByPlaceholderText('New category...'), { target: { value: name } })
  fireEvent.click(screen.getByRole('button', { name: 'Add' }))
}

describe('CategoryList', () => {
  it('should add a regular category by default', () => {
    const onChange = renderList()
    addCategory('Electricity')
    const added = onChange.mock.calls[0][0].at(-1)
    expect(added.name).toBe('Electricity')
    expect(added.isIncome).toBeUndefined()
  })

  it('should add an income category when the income switch is on and reset the switch', async () => {
    const onChange = renderList()
    const incomeSwitch = screen.getByRole('switch', { name: 'Income' })
    fireEvent.click(incomeSwitch)
    await waitFor(() => expect(incomeSwitch.getAttribute('aria-checked')).toBe('true'))
    addCategory('Salary')
    expect(onChange.mock.calls[0][0].at(-1)).toMatchObject({ name: 'Salary', isIncome: true })
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Income' }).getAttribute('aria-checked')).toBe('false'))
  })
})

describe('CategoryList archiving', () => {
  const expenses: Array<Expense> = [
    { id: 'e1', name: 'Old shop', amount: -12, currency: 'PLN', categoryId: 'groceries', date: '2024-02-10', tags: [] },
    { id: 'e2', name: 'Last shop', amount: -30, currency: 'PLN', categoryId: 'groceries', date: '2025-06-15', tags: [] },
  ]

  function renderWith(list: Array<Category>) {
    const onChange = vi.fn()
    render(<CategoryList categories={list} currency="PLN" expenses={expenses} onChange={onChange} onNameChange={vi.fn()} />)
    return onChange
  }

  describe('when archiving an active category', () => {
    it('should ask for confirmation showing the latest transaction before archiving', async () => {
      const onChange = renderWith(categories)
      fireEvent.click(screen.getByRole('button', { name: 'Archive Groceries' }))
      expect(onChange).not.toHaveBeenCalled()
      expect(await screen.findByText(/Last shop/)).toBeTruthy()
      expect(screen.getByRole('link', { name: 'Show transactions' }).getAttribute('href')).toBe('/table?category=groceries')
      fireEvent.click(screen.getByRole('button', { name: 'Archive' }))
      expect(onChange.mock.calls[0][0][0]).toMatchObject({ id: 'groceries', archived: true })
    })

    it('should leave the category untouched when cancelled', async () => {
      const onChange = renderWith(categories)
      fireEvent.click(screen.getByRole('button', { name: 'Archive Groceries' }))
      fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('when restoring an archived category', () => {
    it('should restore it without confirmation', () => {
      const onChange = renderWith([{ ...categories[0], archived: true }])
      expect(screen.getByText('Archived (1)')).toBeTruthy()
      fireEvent.click(screen.getByRole('button', { name: 'Restore Groceries' }))
      expect(onChange.mock.calls[0][0][0].archived).toBeUndefined()
    })
  })
})
