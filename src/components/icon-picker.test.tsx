// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Car, Shapes } from 'lucide-react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IconPicker } from '@/components/icon-picker'

afterEach(cleanup)

function renderPicker(value?: string) {
  const onChange = vi.fn()
  render(
    <IconPicker
      color="#ff0000"
      curated={{ car: Car }}
      allowNone
      placeholder={<Shapes />}
      tooltip="Choose icon"
      triggerLabel="Choose icon for Transport"
      value={value}
      onChange={onChange}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: 'Choose icon for Transport' }))
  return onChange
}

describe('IconPicker', () => {
  describe('when no search query is typed', () => {
    it('should offer the curated icons and the clear option', async () => {
      const onChange = renderPicker('car')
      fireEvent.click(await screen.findByRole('button', { name: 'Icon car' }))
      expect(onChange).toHaveBeenCalledWith('car')
    })

    it('should clear the icon with the none option', async () => {
      const onChange = renderPicker('car')
      fireEvent.click(await screen.findByRole('button', { name: 'No icon' }))
      expect(onChange).toHaveBeenCalledWith(undefined)
    })
  })

  describe('when searching the full icon library', () => {
    it('should list matching lucide icons and pick the chosen name', async () => {
      const onChange = renderPicker()
      fireEvent.change(await screen.findByRole('textbox', { name: 'Search all icons' }), { target: { value: 'hour glass' } })
      fireEvent.click(await screen.findByRole('button', { name: 'Icon hourglass' }))
      expect(onChange).toHaveBeenCalledWith('hourglass')
    })

    it('should say so when nothing matches', async () => {
      renderPicker()
      fireEvent.change(await screen.findByRole('textbox', { name: 'Search all icons' }), { target: { value: 'zzzz-nothing' } })
      expect(await screen.findByText(/No icons match/)).toBeTruthy()
    })
  })
})
