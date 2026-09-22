// @vitest-environment jsdom
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { format } from 'date-fns'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DateRangeNav } from '@/components/date-range-nav'
import { useDateRange } from '@/hooks/use-date-range'
import { searchParamsSchema } from '@/lib/shared/search-params'
import { DashboardTab } from '@/lib/shared/types/dashboard-tab'
import { RangeScope } from '@/lib/shared/types/range-scope'

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function RangePage() {
  const range = useDateRange(15)
  return (
    <>
      <DateRangeNav
        {...range}
        onScopeChange={range.setScope}
        onCustomRangeChange={range.setCustomRange}
        onPrev={range.prev}
        onNext={range.next}
        onReset={range.reset}
      />
      <output data-testid="range">
        {format(range.from, 'yyyy-MM-dd')}/{format(range.to, 'yyyy-MM-dd')}
      </output>
      <button type="button" onClick={() => range.setScope(RangeScope.Year)}>
        Use year
      </button>
    </>
  )
}

async function renderRange(url: string) {
  const root = createRootRoute({ validateSearch: searchParamsSchema, component: Outlet })
  const dashboard = createRoute({ getParentRoute: () => root, path: '/dashboard', component: RangePage })
  const table = createRoute({ getParentRoute: () => root, path: '/table', component: RangePage })
  const router = createRouter({
    routeTree: root.addChildren([dashboard, table]),
    history: createMemoryHistory({ initialEntries: [url] }),
  })
  render(<RouterProvider router={router} />)
  await screen.findByTestId('range')
  return router
}

async function selectCustomRange() {
  fireEvent.click(screen.getByRole('combobox', { name: 'Date range' }))
  const option = await screen.findByRole('option', { name: 'Custom' })
  fireEvent.pointerDown(option)
  fireEvent.click(option)
  await screen.findByLabelText('Start date')
}

describe('useDateRange with date controls', () => {
  describe('when opening a saved custom URL', () => {
    it('should restore inclusive dates without fiscal adjustments and allow editing', async () => {
      await renderRange('/dashboard?scope=custom&from=2024-02-10&to=2024-03-15')
      expect(screen.getByTestId('range').textContent).toBe('2024-02-10/2024-03-16')
      fireEvent.click(screen.getByRole('button', { name: /Edit custom date range/ }))
      expect(screen.getByLabelText<HTMLInputElement>('Start date').value).toBe('2024-02-10')
      expect(screen.getByLabelText<HTMLInputElement>('End date').value).toBe('2024-03-15')
    })
  })

  describe('when applying a custom range', () => {
    it('should persist the dates in the URL while preserving the dashboard tab', async () => {
      const router = await renderRange('/dashboard?scope=month&tab=trends')
      await selectCustomRange()
      fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2024-12-20' } })
      fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2025-01-10' } })
      fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

      await waitFor(() => expect(screen.getByTestId('range').textContent).toBe('2024-12-20/2025-01-11'))
      expect(router.state.location.search).toMatchObject({
        scope: RangeScope.Custom,
        from: '2024-12-20',
        to: '2025-01-10',
        offset: 0,
        tab: DashboardTab.Trends,
      })
      expect(router.state.location.searchStr).toContain('from=2024-12-20')
      expect(router.state.location.searchStr).toContain('to=2025-01-10')
    })
  })

  describe('when custom selection is cancelled', () => {
    it('should leave the preset and URL unchanged', async () => {
      const router = await renderRange('/dashboard?scope=year&offset=-1')
      const href = router.state.location.href
      await selectCustomRange()
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(router.state.location.href).toBe(href)
    })
  })

  describe('when returning to a preset', () => {
    it('should clear custom dates and restore them on browser back', async () => {
      const router = await renderRange('/dashboard?scope=custom&from=2024-02-10&to=2024-03-15')
      fireEvent.click(screen.getByRole('button', { name: 'Use year' }))
      await waitFor(() => expect(router.state.location.search.scope).toBe(RangeScope.Year))
      expect(router.state.location.search.from).toBeUndefined()
      expect(router.state.location.search.to).toBeUndefined()
      await act(async () => router.history.back())
      await waitFor(() => expect(screen.getByTestId('range').textContent).toBe('2024-02-10/2024-03-16'))
    })

    it('should reset a custom range to the current fiscal month', async () => {
      const router = await renderRange('/dashboard?scope=custom&from=2024-02-10&to=2024-03-15')
      fireEvent.click(screen.getByRole('button', { name: 'Back to current period' }))
      await waitFor(() => expect(router.state.location.search.scope).toBe(RangeScope.Month))
      expect(router.state.location.search.offset).toBe(0)
      expect(router.state.location.search.from).toBeUndefined()
      expect(router.state.location.search.to).toBeUndefined()
      expect(screen.queryByRole('button', { name: /Edit custom date range/ })).toBeNull()
    })
  })

  describe('when navigating to the transaction table', () => {
    it('should preserve the selected dates', async () => {
      const router = await renderRange('/dashboard?scope=custom&from=2024-02-10&to=2024-03-15')
      await act(async () => router.navigate({ to: '/table', search: (prev) => prev }))
      expect(router.state.location.pathname).toBe('/table')
      expect(screen.getByTestId('range').textContent).toBe('2024-02-10/2024-03-16')
    })
  })
})
