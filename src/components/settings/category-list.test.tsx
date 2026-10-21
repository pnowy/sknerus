// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CategoryList } from '@/components/settings/category-list'
import type { Category } from '@/lib/shared/types/expense'

afterEach(cleanup)

const categories: Array<Category> = [{ id: 'groceries', name: 'Groceries', color: '#000' }]

function renderList() {
  const onChange = vi.fn()
  render(<CategoryList categories={categories} onChange={onChange} onNameChange={vi.fn()} />)
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
