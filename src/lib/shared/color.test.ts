import { describe, expect, it } from 'vitest'
import { contrastRatio, ensureReadableColor, parseColor } from './color'

const TOOLTIP_BG = '#1a1a1a'

describe('parseColor', () => {
  it('should parse a long hex color', () => {
    expect(parseColor('#336699')).toEqual({ r: 0x33, g: 0x66, b: 0x99 })
  })

  it('should parse a short hex color', () => {
    expect(parseColor('#369')).toEqual({ r: 0x33, g: 0x66, b: 0x99 })
  })

  it('should parse a hex color without the leading hash', () => {
    expect(parseColor('336699')).toEqual({ r: 0x33, g: 0x66, b: 0x99 })
  })

  it('should parse an rgb() color', () => {
    expect(parseColor('rgb(51, 102, 153)')).toEqual({ r: 51, g: 102, b: 153 })
  })

  it('should return null for an unsupported value', () => {
    expect(parseColor('rebeccapurple')).toBeNull()
  })
})

describe('contrastRatio', () => {
  it('should return 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
  })

  it('should return 1 for identical colors', () => {
    expect(contrastRatio('#1a1a1a', '#1a1a1a')).toBeCloseTo(1, 5)
  })

  it('should return 1 when a color cannot be parsed', () => {
    expect(contrastRatio('not-a-color', '#ffffff')).toBe(1)
  })
})

describe('ensureReadableColor', () => {
  it('should keep a color that already has enough contrast', () => {
    expect(ensureReadableColor('#00ff00', TOOLTIP_BG)).toBe('#00ff00')
  })

  it('should lighten black so it becomes readable on a dark background', () => {
    const result = ensureReadableColor('#000000', TOOLTIP_BG)
    expect(result).not.toBe('#000000')
    expect(contrastRatio(result, TOOLTIP_BG)).toBeGreaterThanOrEqual(4.5)
  })

  it('should darken white so it becomes readable on a light background', () => {
    const result = ensureReadableColor('#ffffff', '#ffffff')
    expect(contrastRatio(result, '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })

  it('should preserve the hue direction when lightening a dark color', () => {
    const result = ensureReadableColor('#001a00', TOOLTIP_BG)
    const rgb = parseColor(result)
    expect(rgb).not.toBeNull()
    if (rgb) expect(rgb.g).toBeGreaterThanOrEqual(rgb.r)
  })

  it('should reach the requested contrast ratio for every default and custom color', () => {
    const colors = ['#000000', '#0a0a0a', '#1a1a1a', '#222222', '#f59e0b', '#6366f1', '#10b981', '#8b5cf6', '#06b6d4', '#ffffff']
    for (const color of colors) {
      expect(contrastRatio(ensureReadableColor(color, TOOLTIP_BG), TOOLTIP_BG)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('should respect a custom minimum ratio', () => {
    const result = ensureReadableColor('#000000', TOOLTIP_BG, 3)
    expect(contrastRatio(result, TOOLTIP_BG)).toBeGreaterThanOrEqual(3)
  })

  it('should return the original value when it cannot be parsed', () => {
    expect(ensureReadableColor('', TOOLTIP_BG)).toBe('')
  })
})
