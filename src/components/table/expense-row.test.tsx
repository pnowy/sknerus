// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExpenseRow } from '@/components/table/expense-row'
import type { Category, Expense } from '@/lib/shared/types/expense'

afterEach(cleanup)

const categories: Array<Category> = [{ id: 'cat_groceries', name: 'Groceries', color: '#ff0000' }]

function renderRow(categoryId: string) {
  const expense: Expense = {
    id: 'exp_1',
    name: 'Bread',
    amount: -5,
    currency: 'PLN',
    categoryId,
    date: '2026-11-01',
    tags: [],
  }
  render(
    <table>
      <tbody>
        <ExpenseRow
          categories={categories}
          expense={expense}
          hasTags={false}
          showNotes={false}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
          onEdit={vi.fn()}
        />
      </tbody>
    </table>
  )
}

function categoryDot() {
  return screen.getByText(/Groceries|cat_unknown/).querySelector('[aria-hidden]') as HTMLElement | null
}

describe('ExpenseRow', () => {
  describe('when the category exists', () => {
    it('should show a dot in the category color next to the category name', () => {
      renderRow('cat_groceries')
      expect(categoryDot()?.style.backgroundColor).toBe('rgb(255, 0, 0)')
    })
  })

  describe('when the category is unknown', () => {
    it('should show the category id without a dot', () => {
      renderRow('cat_unknown')
      expect(screen.getByText('cat_unknown')).toBeTruthy()
      expect(categoryDot()).toBeNull()
    })
  })
})
