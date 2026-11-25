// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { CategoryMarker } from '@/components/category-marker'

afterEach(cleanup)

describe('CategoryMarker', () => {
  describe('when the category has no icon', () => {
    it('should render a dot filled with the category color', () => {
      const { container } = render(<CategoryMarker category={{ color: '#ff0000' }} />)
      const dot = container.firstElementChild as HTMLElement
      expect(dot.tagName).toBe('SPAN')
      expect(dot.style.backgroundColor).toBe('rgb(255, 0, 0)')
    })
  })

  describe('when the category has a known icon', () => {
    it('should render the icon in the category color', () => {
      const { container } = render(<CategoryMarker category={{ color: '#ff0000', icon: 'car' }} />)
      const icon = container.querySelector('svg') as SVGElement
      expect(icon).toBeTruthy()
      expect(icon.style.color).toBe('rgb(255, 0, 0)')
    })
  })

  describe('when the icon comes from the full lucide set', () => {
    it('should load it on demand and render it in the category color', async () => {
      const { container } = render(<CategoryMarker category={{ color: '#ff0000', icon: 'hourglass' }} />)
      await waitFor(() => expect(container.querySelector('svg')).toBeTruthy())
      expect((container.querySelector('svg') as SVGElement).style.color).toBe('rgb(255, 0, 0)')
    })
  })

  describe('when the stored icon name does not exist', () => {
    it('should keep showing the color dot', async () => {
      const { container } = render(<CategoryMarker category={{ color: '#ff0000', icon: 'no-such-icon' }} />)
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(container.querySelector('svg')).toBeNull()
      expect((container.firstElementChild as HTMLElement).style.backgroundColor).toBe('rgb(255, 0, 0)')
    })
  })
})
