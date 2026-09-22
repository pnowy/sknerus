// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CustomDateRangeDialog } from '@/components/custom-date-range-dialog'

afterEach(cleanup)

function renderDialog() {
  const onApply = vi.fn()
  const onClose = vi.fn()
  render(<CustomDateRangeDialog from={new Date(2024, 1, 1)} to={new Date(2024, 2, 1)} onApply={onApply} onClose={onClose} />)
  return { onApply, onClose }
}

describe('CustomDateRangeDialog', () => {
  describe('when opened', () => {
    it('should prefill the current range with an inclusive end date', () => {
      renderDialog()
      expect(screen.getByLabelText<HTMLInputElement>('Start date').value).toBe('2024-02-01')
      expect(screen.getByLabelText<HTMLInputElement>('End date').value).toBe('2024-02-29')
    })
  })

  describe('when the dates are valid', () => {
    it('should apply a single-day range and close the dialog', async () => {
      const { onApply, onClose } = renderDialog()
      fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2024-02-15' } })
      fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2024-02-15' } })
      fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
      await waitFor(() => expect(onApply).toHaveBeenCalledWith({ from: '2024-02-15', to: '2024-02-15' }))
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  describe('when the end precedes the start', () => {
    it('should display an error without applying or closing', async () => {
      const { onApply, onClose } = renderDialog()
      fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2024-03-01' } })
      fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
      await screen.findByText('End date must be on or after start date')
      expect(onApply).not.toHaveBeenCalled()
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('when a date is missing', () => {
    it('should display a validation error without applying', async () => {
      const { onApply } = renderDialog()
      fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '' } })
      fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
      await screen.findByText('Enter a valid start date')
      expect(onApply).not.toHaveBeenCalled()
    })
  })

  describe('when cancelled', () => {
    it('should close without changing the applied range', () => {
      const { onApply, onClose } = renderDialog()
      fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2024-02-15' } })
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(onClose).toHaveBeenCalledOnce()
      expect(onApply).not.toHaveBeenCalled()
    })
  })
})
